import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../../.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'keftaportal',
});

async function publishAll() {
  await pool.query("UPDATE public_exams SET status = 'published' WHERE id LIKE 'exam-%'");
  console.log("All 8 certification exams published successfully!");
  const [rows] = await pool.query("SELECT id, name, status, total_questions, total_marks FROM public_exams WHERE id LIKE 'exam-%'");
  console.table(rows);
  process.exit(0);
}

publishAll();
