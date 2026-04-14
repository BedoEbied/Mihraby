import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '@/lib/db/connection';
import { ICourse, CreateCourseDTO, UpdateCourseDTO, CourseWithInstructor } from '@/types';

/**
 * Course Model - handles all database operations for courses
 */
export class Course {
  /**
   * Find course by ID
   */
  static async findById(id: number): Promise<ICourse | null> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM courses WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as ICourse;
    } catch (error) {
      console.error('Error finding course by ID:', error);
      throw error;
    }
  }

  /**
   * Get all courses with instructor details
   */
  static async findAll(): Promise<CourseWithInstructor[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          c.*,
          u.name as instructor_name,
          u.email as instructor_email
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        ORDER BY c.created_at DESC
      `);

      return rows.map(Course.mapRowToCourseWithInstructor);
    } catch (error) {
      console.error('Error fetching all courses:', error);
      throw error;
    }
  }

  /**
   * Get published courses only
   */
  static async findPublished(): Promise<CourseWithInstructor[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(`
        SELECT
          c.*,
          u.name as instructor_name,
          u.email as instructor_email
        FROM courses c
        LEFT JOIN users u ON c.instructor_id = u.id
        WHERE c.status = 'published'
        ORDER BY c.created_at DESC
      `);

      return rows.map(Course.mapRowToCourseWithInstructor);
    } catch (error) {
      console.error('Error fetching published courses:', error);
      throw error;
    }
  }

  private static mapRowToCourseWithInstructor(row: RowDataPacket): CourseWithInstructor {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      instructor_id: row.instructor_id,
      price: Number(row.price),
      image_url: row.image_url,
      status: row.status,
      slot_duration: row.slot_duration,
      price_per_slot: Number(row.price_per_slot),
      meeting_platform: row.meeting_platform,
      meeting_link: row.meeting_link,
      currency: row.currency,
      created_at: row.created_at,
      instructor: {
        name: row.instructor_name,
        email: row.instructor_email
      }
    };
  }

  /**
   * Get courses by instructor ID
   */
  static async findByInstructor(instructorId: number): Promise<ICourse[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM courses WHERE instructor_id = ? ORDER BY created_at DESC',
        [instructorId]
      );

      return rows as ICourse[];
    } catch (error) {
      console.error('Error fetching instructor courses:', error);
      throw error;
    }
  }

  /**
   * Create new course
   */
  static async create(courseData: CreateCourseDTO, instructorId: number): Promise<ICourse> {
    try {
      const {
        title,
        description,
        price,
        image_url,
        status = 'draft',
        slot_duration = 60,
        price_per_slot = 0,
        meeting_platform = 'manual',
        meeting_link,
        currency = 'USD',
      } = courseData;

      const [result] = await pool.query<ResultSetHeader>(
        `INSERT INTO courses
          (title, description, instructor_id, price, image_url, status,
           slot_duration, price_per_slot, meeting_platform, meeting_link, currency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          title,
          description || null,
          instructorId,
          price,
          image_url || null,
          status,
          slot_duration,
          price_per_slot,
          meeting_platform,
          meeting_link || null,
          currency,
        ]
      );

      const newCourse = await this.findById(result.insertId);

      if (!newCourse) {
        throw new Error('Failed to create course');
      }

      return newCourse;
    } catch (error) {
      console.error('Error creating course:', error);
      throw error;
    }
  }

  /**
   * Update course
   */
  static async update(courseId: number, updateData: UpdateCourseDTO): Promise<boolean> {
    try {
      const fields: string[] = [];
      const values: Array<string | number | null> = [];

      if (updateData.title !== undefined) {
        fields.push('title = ?');
        values.push(updateData.title);
      }
      if (updateData.description !== undefined) {
        fields.push('description = ?');
        values.push(updateData.description);
      }
      if (updateData.price !== undefined) {
        fields.push('price = ?');
        values.push(updateData.price);
      }
      if (updateData.image_url !== undefined) {
        fields.push('image_url = ?');
        values.push(updateData.image_url);
      }
      if (updateData.status !== undefined) {
        fields.push('status = ?');
        values.push(updateData.status);
      }
      if (updateData.slot_duration !== undefined) {
        fields.push('slot_duration = ?');
        values.push(updateData.slot_duration);
      }
      if (updateData.price_per_slot !== undefined) {
        fields.push('price_per_slot = ?');
        values.push(updateData.price_per_slot);
      }
      if (updateData.meeting_platform !== undefined) {
        fields.push('meeting_platform = ?');
        values.push(updateData.meeting_platform);
      }
      if (updateData.meeting_link !== undefined) {
        fields.push('meeting_link = ?');
        values.push(updateData.meeting_link);
      }
      if (updateData.currency !== undefined) {
        fields.push('currency = ?');
        values.push(updateData.currency);
      }

      if (fields.length === 0) {
        return false;
      }

      values.push(courseId);

      const [result] = await pool.query<ResultSetHeader>(
        `UPDATE courses SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  }

  /**
   * Delete course
   */
  static async delete(courseId: number): Promise<boolean> {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'DELETE FROM courses WHERE id = ?',
        [courseId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting course:', error);
      throw error;
    }
  }
}

export default Course;
