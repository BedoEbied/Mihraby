import { Enrollment } from '@/lib/db/models/Enrollment';
import { Course } from '@/lib/db/models/Course';
import { IEnrollment, EnrollmentWithDetails, UserRole } from '@/types';

/**
 * Enrollment Service - Pure business logic
 */
export class EnrollmentService {
  /**
   * Enroll user in course
   */
  static async enrollInCourse(userId: number, courseId: number): Promise<IEnrollment> {
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Check if already enrolled
    const alreadyEnrolled = await Enrollment.isEnrolled(userId, courseId);
    if (alreadyEnrolled) {
      throw new Error('Already enrolled in this course');
    }

    return await Enrollment.enroll(userId, courseId);
  }

  /**
   * Get user's enrollments
   */
  static async getUserEnrollments(userId: number): Promise<EnrollmentWithDetails[]> {
    return await Enrollment.getUserEnrollments(userId);
  }

  /**
   * Get course enrollments (for instructors/admins)
   */
  static async getCourseEnrollments(
    userId: number,
    userRole: UserRole,
    courseId: number
  ): Promise<EnrollmentWithDetails[]> {
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Authorization check
    if (course.instructor_id !== userId && userRole !== UserRole.ADMIN) {
      throw new Error('You can only view enrollments for your own courses');
    }

    return await Enrollment.getCourseEnrollments(courseId);
  }

  /**
   * Unenroll user from course
   */
  static async unenrollFromCourse(userId: number, courseId: number): Promise<void> {
    const unenrolled = await Enrollment.unenroll(userId, courseId);
    if (!unenrolled) {
      throw new Error('Enrollment not found');
    }
  }
}
