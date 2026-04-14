/**
 * Seed script for local/testing.
 * Requires DB env vars to be set; uses the same connection as the app.
 * Inserts a handful of users, courses, and enrollments.
 */
import 'dotenv/config';
import pool from '../lib/db/connection';
import { UserRole } from '../types';

async function main() {
  console.log('Seeding database...', {
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
  });
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Users
    const [userInsert] = await conn.query(
      'INSERT IGNORE INTO users (email, password, name, role) VALUES ?',
      [[
        ['admin@example.com', '$2b$10$seedadmin', 'Admin User', UserRole.ADMIN],
        ['instructor1@example.com', '$2b$10$seedinstr', 'Instructor One', UserRole.INSTRUCTOR],
        ['instructor2@example.com', '$2b$10$seedinstr', 'Instructor Two', UserRole.INSTRUCTOR],
        ['student1@example.com', '$2b$10$seedstud', 'Student One', UserRole.STUDENT],
        ['student2@example.com', '$2b$10$seedstud', 'Student Two', UserRole.STUDENT],
      ]]
    );
    console.log('Users inserted/ignored:', (userInsert as { affectedRows?: number }).affectedRows ?? 0);

    // Fetch inserted IDs
    const [userRows] = await conn.query('SELECT id, email, role FROM users WHERE email LIKE "%@example.com"');
    const users = Array.isArray(userRows) ? (userRows as Array<{ id: number; email: string; role: string }>) : [];
    const instr1 = users.find((u) => u.email === 'instructor1@example.com')?.id;
    const instr2 = users.find((u) => u.email === 'instructor2@example.com')?.id;
    const student1 = users.find((u) => u.email === 'student1@example.com')?.id;
    const student2 = users.find((u) => u.email === 'student2@example.com')?.id;

    if (!instr1 || !instr2) {
      throw new Error('Required instructor accounts not found; aborting seed.');
    }

    // Courses
    const [courseInsert] = await conn.query(
      'INSERT IGNORE INTO courses (title, description, instructor_id, price, status) VALUES ?',
      [[
        ['Intro to Seed', 'Seeded course 1', instr1, 0, 'published'],
        ['Advanced Seed', 'Seeded course 2', instr1, 50, 'draft'],
        ['Seed Mastery', 'Seeded course 3', instr2, 100, 'published'],
      ]]
    );
    console.log('Courses inserted/ignored:', (courseInsert as { affectedRows?: number }).affectedRows ?? 0);

    const [courseRows] = await conn.query('SELECT id FROM courses WHERE title LIKE "%Seed%" ORDER BY id ASC');
    const courses = Array.isArray(courseRows) ? (courseRows as Array<{ id: number }>) : [];
    const course1 = courses[0]?.id;
    const course2 = courses[1]?.id;

    // Enrollments
    if (student1 && course1) {
      const [en1] = await conn.query('INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)', [student1, course1]);
      console.log('Enrollment 1 inserted/ignored:', (en1 as { affectedRows?: number }).affectedRows ?? 0);
    }
    if (student2 && course2) {
      const [en2] = await conn.query('INSERT IGNORE INTO enrollments (user_id, course_id) VALUES (?, ?)', [student2, course2]);
      console.log('Enrollment 2 inserted/ignored:', (en2 as { affectedRows?: number }).affectedRows ?? 0);
    }

    await conn.commit();
    console.log('Seed complete.');
  } catch (err) {
    await conn.rollback();
    console.error('Seed failed', err);
    throw err;
  } finally {
    conn.release();
  }
}

main()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
