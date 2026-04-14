import { User } from '@/lib/db/models/User';
import { Course } from '@/lib/db/models/Course';
import { UserRole, UserWithoutPassword, CourseWithInstructor } from '@/types';

/**
 * Admin Service - Pure business logic
 */
export class AdminService {
  /**
   * Get all users
   */
  static async getAllUsers(): Promise<UserWithoutPassword[]> {
    return await User.findAll();
  }

  /**
   * Update user role
   */
  static async updateUserRole(userId: number, newRole: UserRole): Promise<void> {
    const updated = await User.updateRole(userId, newRole);
    if (!updated) {
      throw new Error('User not found');
    }
  }

  /**
   * Delete user
   */
  static async deleteUser(currentUserId: number, targetUserId: number): Promise<void> {
    // Prevent self-deletion
    if (currentUserId === targetUserId) {
      throw new Error('Cannot delete your own account');
    }

    const deleted = await User.delete(targetUserId);
    if (!deleted) {
      throw new Error('User not found');
    }
  }

  /**
   * Get all courses (including drafts)
   */
  static async getAllCourses(): Promise<CourseWithInstructor[]> {
    return await Course.findAll();
  }

  /**
   * Delete any course (admin power)
   */
  static async deleteCourse(courseId: number): Promise<void> {
    const deleted = await Course.delete(courseId);
    if (!deleted) {
      throw new Error('Course not found');
    }
  }
}
