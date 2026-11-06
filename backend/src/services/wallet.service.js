import { v4 as uuidv4 } from 'uuid';
import { pool } from '../db/connection.js';

export class WalletService {
  /**
   * Get total tokens remaining and wallet list for a sub-center organization
   */
  static async getSubCenterWallets(orgId) {
    const [wallets] = await pool.query(
      `SELECT w.*, tp.name as package_name 
       FROM sub_center_wallets w
       JOIN token_packages tp ON w.package_id = tp.id
       WHERE w.org_id = ?
       ORDER BY w.purchased_at ASC`,
      [orgId]
    );

    const totalRemaining = wallets.reduce((acc, w) => acc + Number(w.tokens_remaining), 0);
    const totalPurchased = wallets.reduce((acc, w) => acc + Number(w.tokens_purchased), 0);
    const totalUsed = wallets.reduce((acc, w) => acc + Number(w.tokens_used), 0);

    return {
      totalRemaining,
      totalPurchased,
      totalUsed,
      wallets
    };
  }

  /**
   * Deduct tokens in FIFO order (oldest purchased_at first)
   */
  static async deductTokensFIFO(connection, { orgId, count, batchId = null, assignmentId = null }) {
    if (count <= 0) return [];

    // Lock wallets for update
    const [wallets] = await connection.query(
      `SELECT id, tokens_remaining, tokens_used 
       FROM sub_center_wallets 
       WHERE org_id = ? AND tokens_remaining > 0 
       ORDER BY purchased_at ASC 
       FOR UPDATE`,
      [orgId]
    );

    const totalAvailable = wallets.reduce((sum, w) => sum + Number(w.tokens_remaining), 0);
    if (totalAvailable < count) {
      throw new Error(`Insufficient tokens remaining. Required: ${count}, Available: ${totalAvailable}`);
    }

    let remainingToDeduct = count;
    const deductions = [];

    for (const wallet of wallets) {
      if (remainingToDeduct <= 0) break;

      const avail = Number(wallet.tokens_remaining);
      const take = Math.min(avail, remainingToDeduct);

      const newRemaining = avail - take;
      const newUsed = Number(wallet.tokens_used) + take;

      await connection.query(
        `UPDATE sub_center_wallets 
         SET tokens_remaining = ?, tokens_used = ? 
         WHERE id = ?`,
        [newRemaining, newUsed, wallet.id]
      );

      const txId = uuidv4();
      await connection.query(
        `INSERT INTO token_transactions 
         (id, org_id, wallet_id, type, token_count, related_batch_id, related_assignment_id)
         VALUES (?, ?, ?, 'consume', ?, ?, ?)`,
        [txId, orgId, wallet.id, -take, batchId, assignmentId]
      );

      deductions.push({ walletId: wallet.id, amount: take });
      remainingToDeduct -= take;
    }

    return deductions;
  }

  /**
   * Refund tokens to a specific wallet
   */
  static async refundTokens(connection, { orgId, walletId, amount, type, batchId = null, assignmentId = null }) {
    if (amount <= 0) return;

    await connection.query(
      `UPDATE sub_center_wallets 
       SET tokens_remaining = tokens_remaining + ?, 
           tokens_used = GREATEST(0, tokens_used - ?)
       WHERE id = ? AND org_id = ?`,
      [amount, amount, walletId, orgId]
    );

    const txId = uuidv4();
    await connection.query(
      `INSERT INTO token_transactions 
       (id, org_id, wallet_id, type, token_count, related_batch_id, related_assignment_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [txId, orgId, walletId, type, amount, batchId, assignmentId]
    );
  }

  /**
   * Purchase a token package for a sub-center
   */
  static async purchaseTokenPackage({ orgId, packageId }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [pkgs] = await connection.query(
        `SELECT * FROM token_packages WHERE id = ? AND status = 'active'`,
        [packageId]
      );
      if (pkgs.length === 0) {
        throw new Error('Token package not found or retired.');
      }
      const pkg = pkgs[0];

      const walletId = uuidv4();
      await connection.query(
        `INSERT INTO sub_center_wallets 
         (id, org_id, package_id, tokens_purchased, tokens_used, tokens_remaining, purchased_at)
         VALUES (?, ?, ?, ?, 0, ?, NOW())`,
        [walletId, orgId, pkg.id, pkg.token_count, pkg.token_count]
      );

      const txId = uuidv4();
      await connection.query(
        `INSERT INTO token_transactions 
         (id, org_id, wallet_id, type, token_count)
         VALUES (?, ?, ?, 'purchase', ?)`,
        [txId, orgId, walletId, pkg.token_count]
      );

      await connection.commit();
      return { walletId, tokensPurchased: pkg.token_count };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Create a token purchase request from a sub-center
   */
  static async createTokenRequest({ orgId, packageId, requestedByUserId = null, paymentReference = null, notes = null }) {
    const [pkgs] = await pool.query(
      `SELECT * FROM token_packages WHERE id = ? AND status = 'active'`,
      [packageId]
    );
    if (pkgs.length === 0) {
      throw new Error('Token package not found or retired.');
    }
    const pkg = pkgs[0];

    const requestId = uuidv4();
    await pool.query(
      `INSERT INTO token_purchase_requests 
       (id, org_id, package_id, token_count, amount, requested_by_user_id, status, payment_reference, admin_notes)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)`,
      [requestId, orgId, pkg.id, pkg.token_count, pkg.price, requestedByUserId, paymentReference, notes]
    );

    return {
      id: requestId,
      org_id: orgId,
      package_id: pkg.id,
      package_name: pkg.name,
      token_count: pkg.token_count,
      amount: pkg.price,
      status: 'pending'
    };
  }

  /**
   * Approve a token purchase request and issue tokens to sub-center wallet
   */
  static async approveTokenRequest({ requestId, adminUserId, adminNotes = null, paymentReference = null }) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [requests] = await connection.query(
        `SELECT r.*, tp.name as package_name, o.name as org_name
         FROM token_purchase_requests r
         JOIN token_packages tp ON r.package_id = tp.id
         JOIN organizations o ON r.org_id = o.id
         WHERE r.id = ? FOR UPDATE`,
        [requestId]
      );

      if (requests.length === 0) {
        throw new Error('Token purchase request not found.');
      }

      const req = requests[0];
      if (req.status !== 'pending') {
        throw new Error(`Cannot approve request with status '${req.status}'.`);
      }

      const walletId = uuidv4();
      await connection.query(
        `INSERT INTO sub_center_wallets 
         (id, org_id, package_id, tokens_purchased, tokens_used, tokens_remaining, purchased_at)
         VALUES (?, ?, ?, ?, 0, ?, NOW())`,
        [walletId, req.org_id, req.package_id, req.token_count, req.token_count]
      );

      const txId = uuidv4();
      await connection.query(
        `INSERT INTO token_transactions 
         (id, org_id, wallet_id, type, token_count)
         VALUES (?, ?, ?, 'purchase', ?)`,
        [txId, req.org_id, walletId, req.token_count]
      );

      await connection.query(
        `UPDATE token_purchase_requests
         SET status = 'approved',
             approved_by_user_id = ?,
             approved_at = NOW(),
             admin_notes = COALESCE(?, admin_notes),
             payment_reference = COALESCE(?, payment_reference)
         WHERE id = ?`,
        [adminUserId, adminNotes, paymentReference, requestId]
      );

      await connection.commit();
      return {
        requestId,
        orgId: req.org_id,
        orgName: req.org_name,
        packageId: req.package_id,
        packageName: req.package_name,
        tokensIssued: req.token_count,
        walletId
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Reject a token purchase request
   */
  static async rejectTokenRequest({ requestId, adminUserId, adminNotes = null }) {
    const [requests] = await pool.query(
      `SELECT * FROM token_purchase_requests WHERE id = ?`,
      [requestId]
    );

    if (requests.length === 0) {
      throw new Error('Token purchase request not found.');
    }

    const req = requests[0];
    if (req.status !== 'pending') {
      throw new Error(`Cannot reject request with status '${req.status}'.`);
    }

    await pool.query(
      `UPDATE token_purchase_requests
       SET status = 'rejected',
           approved_by_user_id = ?,
           admin_notes = ?
       WHERE id = ?`,
      [adminUserId, adminNotes, requestId]
    );

    return { requestId, status: 'rejected' };
  }

  /**
   * Take back / refund tokens from a sub-center organization
   */
  static async revokeOrRefundTokens({ orgId, amount, reason = null, adminUserId = null }) {
    if (!amount || Number(amount) <= 0) {
      throw new Error('A valid positive token amount is required.');
    }
    const count = parseInt(amount, 10);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [[org]] = await connection.query('SELECT id, name FROM organizations WHERE id = ?', [orgId]);
      if (!org) {
        throw new Error('Partner organization not found.');
      }

      // Lock wallets for update, latest purchased first (LIFO order for refund/clawback)
      const [wallets] = await connection.query(
        `SELECT id, tokens_remaining, tokens_used, tokens_purchased, purchased_at 
         FROM sub_center_wallets 
         WHERE org_id = ? AND tokens_remaining > 0 
         ORDER BY purchased_at DESC 
         FOR UPDATE`,
        [orgId]
      );

      const totalAvailable = wallets.reduce((sum, w) => sum + Number(w.tokens_remaining), 0);
      if (totalAvailable < count) {
        throw new Error(`Cannot refund ${count} tokens. ${org.name} only has ${totalAvailable} available tokens remaining.`);
      }

      let remainingToDeduct = count;
      const deductions = [];

      for (const wallet of wallets) {
        if (remainingToDeduct <= 0) break;

        const avail = Number(wallet.tokens_remaining);
        const take = Math.min(avail, remainingToDeduct);

        const newRemaining = avail - take;
        const newPurchased = Math.max(0, Number(wallet.tokens_purchased) - take);

        await connection.query(
          `UPDATE sub_center_wallets 
           SET tokens_remaining = ?, tokens_purchased = ? 
           WHERE id = ?`,
          [newRemaining, newPurchased, wallet.id]
        );

        const txId = uuidv4();
        await connection.query(
          `INSERT INTO token_transactions 
           (id, org_id, wallet_id, type, token_count, notes)
           VALUES (?, ?, ?, 'admin_refund', ?, ?)`,
          [txId, orgId, wallet.id, -take, reason || 'Admin token refund / clawback']
        );

        deductions.push({ walletId: wallet.id, amount: take });
        remainingToDeduct -= take;
      }

      await connection.commit();

      const newBalance = totalAvailable - count;
      return {
        orgId,
        orgName: org.name,
        refundedTokens: count,
        remainingBalance: newBalance,
        deductions
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Manually grant tokens to a sub-center organization
   */
  static async grantTokens({ orgId, amount, reason = null, adminUserId = null }) {
    if (!amount || Number(amount) <= 0) {
      throw new Error('A valid positive token amount is required.');
    }
    const count = parseInt(amount, 10);

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      const [[org]] = await connection.query('SELECT id, name FROM organizations WHERE id = ?', [orgId]);
      if (!org) {
        throw new Error('Partner organization not found.');
      }

      const [pkgs] = await connection.query(`SELECT id FROM token_packages WHERE status = 'active' LIMIT 1`);
      const pkgId = pkgs[0]?.id || 'tp-starter-50';

      const walletId = uuidv4();
      await connection.query(
        `INSERT INTO sub_center_wallets 
         (id, org_id, package_id, tokens_purchased, tokens_used, tokens_remaining, purchased_at)
         VALUES (?, ?, ?, ?, 0, ?, NOW())`,
        [walletId, orgId, pkgId, count, count]
      );

      const txId = uuidv4();
      await connection.query(
        `INSERT INTO token_transactions 
         (id, org_id, wallet_id, type, token_count, notes)
         VALUES (?, ?, ?, 'admin_grant', ?, ?)`,
        [txId, orgId, walletId, count, reason || 'Admin manual token grant']
      );

      await connection.commit();
      return {
        orgId,
        orgName: org.name,
        grantedTokens: count,
        walletId
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}
