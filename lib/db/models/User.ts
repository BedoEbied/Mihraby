import { RowDataPacket, ResultSetHeader } from 'mysql2';
import pool from '@/lib/db/connection';
import { IUser, UserRole, RegisterDTO, UserWithoutPassword } from '@/types';

/**
 * User Model - handles all database operations for users
 */
export class User {
  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<IUser | null> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as IUser;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  /**
   * Find user by ID
   */
  static async findById(id: number): Promise<IUser | null> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as IUser;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  /**
   * Create new user
   */
  static async create(userData: RegisterDTO & { password: string }): Promise<IUser> {
    try {
      const { email, password, name, role = UserRole.STUDENT } = userData;

      const [result] = await pool.query<ResultSetHeader>(
        'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
        [email, password, name, role]
      );

      const newUser = await this.findById(result.insertId);

      if (!newUser) {
        throw new Error('Failed to create user');
      }

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Update user role (admin only)
   */
  static async updateRole(userId: number, newRole: UserRole): Promise<boolean> {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'UPDATE users SET role = ? WHERE id = ?',
        [newRole, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  }

  /**
   * Get all users (without passwords)
   */
  static async findAll(): Promise<UserWithoutPassword[]> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC'
      );

      return rows as UserWithoutPassword[];
    } catch (error) {
      console.error('Error fetching all users:', error);
      throw error;
    }
  }

  /**
   * Delete user by ID
   */
  static async delete(userId: number): Promise<boolean> {
    try {
      const [result] = await pool.query<ResultSetHeader>(
        'DELETE FROM users WHERE id = ?',
        [userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * Get user without password field
   */
  static async findByIdWithoutPassword(id: number): Promise<UserWithoutPassword | null> {
    try {
      const [rows] = await pool.query<RowDataPacket[]>(
        'SELECT id, email, name, role, created_at FROM users WHERE id = ?',
        [id]
      );

      if (rows.length === 0) {
        return null;
      }

      return rows[0] as UserWithoutPassword;
    } catch (error) {
      console.error('Error finding user without password:', error);
      throw error;
    }
  }
}

export default User;
