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
}
