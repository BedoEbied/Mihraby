import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '@/lib/db/connection';
import { IEnrollment, EnrollmentWithDetails } from '@/types';

/**
 * Enrollment Model - handles course enrollments
 */
export class Enrollment {
  /**
   * Check if user is enrolled in course
   */
  static async isEnrolled(userId: number, courseId: number): Promise<boolean> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id FROM enrollments WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
      );

      return rows.length > 0;
    } catch (error) {
      console.error('Error checking enrollment:', error);
      throw error;
    }
  }

  /**
   * Enroll user in course
   */
  static async enroll(userId: number, courseId: number): Promise<IEnrollment> {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)',
        [userId, courseId]
      );

      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM enrollments WHERE id = ?',
        [result.insertId]
      );

      return rows[0] as IEnrollment;
    } catch (error) {
      console.error('Error enrolling user:', error);
      throw error;
    }
  }

  /**
   * Get user's enrollments with course details
   */
  static async getUserEnrollments(userId: number): Promise<EnrollmentWithDetails[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
          e.*,
          c.title as course_title,
          c.price as course_price,
          u.name as student_name,
          u.email as student_email
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON e.user_id = u.id
        WHERE e.user_id = ?
        ORDER BY e.enrolled_at DESC
      `, [userId]);

      return rows as EnrollmentWithDetails[];
    } catch (error) {
      console.error('Error fetching user enrollments:', error);
      throw error;
    }
  }

  /**
   * Get course enrollments (for instructors/admins)
   */
  static async getCourseEnrollments(courseId: number): Promise<EnrollmentWithDetails[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT 
          e.*,
          c.title as course_title,
          c.price as course_price,
          u.name as student_name,
          u.email as student_email
        FROM enrollments e
        JOIN courses c ON e.course_id = c.id
        JOIN users u ON e.user_id = u.id
        WHERE e.course_id = ?
        ORDER BY e.enrolled_at DESC
      `, [courseId]);

      return rows as EnrollmentWithDetails[];
    } catch (error) {
      console.error('Error fetching course enrollments:', error);
      throw error;
    }
  }

  /**
   * Unenroll user from course
   */
  static async unenroll(userId: number, courseId: number): Promise<boolean> {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'DELETE FROM enrollments WHERE user_id = ? AND course_id = ?',
        [userId, courseId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error unenrolling user:', error);
      throw error;
    }
  }
}

export default Enrollment;
