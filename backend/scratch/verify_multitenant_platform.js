import { pool } from '../src/db/connection.js';
import { WalletService } from '../src/services/wallet.service.js';
import { BatchService } from '../src/services/batch.service.js';
import { ExamSessionService } from '../src/services/exam-session.service.js';
import { v4 as uuidv4 } from 'uuid';

async function runVerification() {
  console.log('=== Starting Multi-Tenant Certification Platform Verification ===\n');

  try {
    // 1. Create Sub-Center Organization
    const orgId = uuidv4();
    await pool.query(
      `INSERT INTO organizations (id, name, contact_email, contact_phone, status) 
       VALUES (?, 'Test Sub-Center Alpha', 'alpha@subcenter.com', '+1-800-555-1111', 'active')`,
      [orgId]
    );
    console.log('✔ Sub-Center Organization Created:', orgId);

    // 2. Register Students under Sub-Center
    const student1Id = uuidv4();
    const student2Id = uuidv4();
    await pool.query(
      `INSERT INTO students (id, org_id, name, email, phone) VALUES 
       (?, ?, 'Alice Smith', 'alice@example.com', '1234567890'),
       (?, ?, 'Bob Jones', 'bob@example.com', '0987654321')`,
      [student1Id, orgId, student2Id, orgId]
    );
    console.log('✔ 2 Students Registered under Sub-Center (org_id scoped)');

    // 3. Purchase Token Package for Sub-Center
    const purchaseRes = await WalletService.purchaseTokenPackage({
      orgId,
      packageId: 'tp-starter-50'
    });
    console.log('✔ Token Package Purchased (50 tokens):', purchaseRes);

    const walletCheck = await WalletService.getSubCenterWallets(orgId);
    console.log('✔ Wallet Status:', {
      totalRemaining: walletCheck.totalRemaining,
      totalPurchased: walletCheck.totalPurchased
    });
    if (walletCheck.totalRemaining !== 50) throw new Error('Wallet token count mismatch!');

    // 4. Create Exam Catalog Item (with max_attempts = 2)
    const examId = uuidv4();
    await pool.query(
      `INSERT INTO exams (id, name, description, duration_minutes, max_attempts, status)
       VALUES (?, 'Advanced Security Specialist', 'Security exam', 60, 2, 'active')`,
      [examId]
    );
    console.log('✔ Exam Catalog Item Created:', examId);

    // 5. Create Batch (deducting 2 tokens FIFO)
    const staffUserId = uuidv4();
    const batchRes = await BatchService.createBatch({
      orgId,
      examId,
      createdBy: staffUserId,
      studentIds: [student1Id, student2Id],
      opensAt: new Date(),
      closesAt: new Date(Date.now() + 3600000)
    });
    console.log('✔ Batch Created with 2 Students:', batchRes);

    const walletAfterBatch = await WalletService.getSubCenterWallets(orgId);
    console.log('✔ Wallet Remaining after Batch Creation:', walletAfterBatch.totalRemaining);
    if (walletAfterBatch.totalRemaining !== 48) throw new Error('FIFO token deduction mismatch!');

    // 6. Test Exam Session Start & Abnormal Termination Signal
    const assignment1Id = batchRes.assignmentIds[0];
    const sessionStart = await ExamSessionService.startSitting({ assignmentId: assignment1Id });
    console.log('✔ Exam Sitting Started:', sessionStart);

    const abnormalRes = await ExamSessionService.endSitting({
      attemptId: sessionStart.attemptId,
      endReason: 'technical_void',
      score: 0,
      percentage: 0,
      passed: false
    });
    console.log('✔ Abnormal Termination Handled (Auto-Retry Granted):', abnormalRes);

    // Check attempts count for assignment
    const [assignRows] = await pool.query(`SELECT attempts_used, max_attempts, status FROM exam_assignments WHERE id = ?`, [assignment1Id]);
    console.log('✔ Assignment State after Technical Void:', assignRows[0]);
    if (assignRows[0].status !== 'not_started' || assignRows[0].attempts_used !== 1) {
      throw new Error('Technical void auto-retry logic error!');
    }

    // 7. Restart Sitting & Submit Pass (Certificate Issuance)
    const retrySession = await ExamSessionService.startSitting({ assignmentId: assignment1Id });
    console.log('✔ Second Sitting Started:', retrySession);

    const passRes = await ExamSessionService.endSitting({
      attemptId: retrySession.attemptId,
      endReason: 'submitted',
      score: 95,
      percentage: 95,
      passed: true
    });
    console.log('✔ Exam Submitted & Passed:', passRes);

    const [certRows] = await pool.query(`SELECT * FROM certificates WHERE assignment_id = ?`, [assignment1Id]);
    console.log('✔ Certificate Issued:', certRows[0]);
    if (!certRows[0] || !certRows[0].pdf_url) throw new Error('Certificate issuance failure!');

    // 8. Test Dedicated Single-Student Retry Link for Failed Assignment
    const assignment2Id = batchRes.assignmentIds[1];
    // Fail assignment 2 twice to exhaust attempts
    const sat2_1 = await ExamSessionService.startSitting({ assignmentId: assignment2Id });
    await ExamSessionService.endSitting({ attemptId: sat2_1.attemptId, endReason: 'submitted', score: 20, percentage: 20, passed: false });
    
    // Grant manual retry to try second attempt
    await ExamSessionService.grantManualRetry({ orgId, assignmentId: assignment2Id, staffUserId });
    const sat2_2 = await ExamSessionService.startSitting({ assignmentId: assignment2Id });
    await ExamSessionService.endSitting({ attemptId: sat2_2.attemptId, endReason: 'submitted', score: 30, percentage: 30, passed: false });

    const [assign2Rows] = await pool.query(`SELECT status FROM exam_assignments WHERE id = ?`, [assignment2Id]);
    console.log('✔ Assignment 2 Status after 2 clean fails:', assign2Rows[0].status);
    if (assign2Rows[0].status !== 'failed') throw new Error('Expected assignment status failed!');

    // Generate Dedicated Single-Student Retry Link
    const retryLinkRes = await BatchService.createDedicatedRetryLink({
      orgId,
      originalAssignmentId: assignment2Id
    });
    console.log('✔ Dedicated Retry Link Created (1 token deducted):', retryLinkRes);

    const walletAfterRetryLink = await WalletService.getSubCenterWallets(orgId);
    console.log('✔ Wallet Remaining after Retry Link:', walletAfterRetryLink.totalRemaining);
    if (walletAfterRetryLink.totalRemaining !== 47) throw new Error('Retry link token deduction error!');

    // 9. Audit Trail Verification
    const [txRows] = await pool.query(`SELECT type, token_count FROM token_transactions WHERE org_id = ?`, [orgId]);
    console.log('✔ Audit Transactions Count:', txRows.length, txRows);

    console.log('\n======================================================');
    console.log('   ALL MULTI-TENANT VERIFICATION TESTS PASSED SUCCESSFULLY!');
    console.log('======================================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

runVerification();
