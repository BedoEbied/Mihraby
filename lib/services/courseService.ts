import { Course } from '@/lib/db/models/Course';
import { CreateCourseDTO, UpdateCourseDTO, ICourse, CourseWithInstructor, UserRole } from '@/types';

/**
 * Course Service - Pure business logic
 */
export class CourseService {
  /**
   * Get all courses with optional filtering
   */
  static async getAllCourses(status?: 'published'): Promise<CourseWithInstructor[]> {
    if (status === 'published') {
      return await Course.findPublished();
    }
    return await Course.findAll();
  }

  /**
   * Get course by ID
   */
  static async getCourseById(courseId: number): Promise<ICourse> {
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  }

  /**
   * Get courses by instructor ID
   */
  static async getCoursesByInstructor(instructorId: number): Promise<ICourse[]> {
    return await Course.findByInstructor(instructorId);
  }

  /**
   * Create new course
   */
  static async createCourse(instructorId: number, data: CreateCourseDTO): Promise<ICourse> {
    CourseService.assertManualMeetingPlatform(data);
    return await Course.create(data, instructorId);
  }

  /**
   * US launch guard: only manual meeting platforms are supported today.
   * Zoom / Google Meet automation is deferred — this prevents a Zoom course
   * from reaching confirmBooking and crashing at meeting-creation time.
   */
  private static assertManualMeetingPlatform(data: { meeting_platform?: string }) {
    if (data.meeting_platform && data.meeting_platform !== 'manual') {
      throw new Error("Only 'manual' meeting_platform is supported at launch");
    }
  }

  /**
   * Update course with authorization check
   */
  static async updateCourse(
    userId: number,
    userRole: UserRole,
    courseId: number,
    data: UpdateCourseDTO
  ): Promise<ICourse> {
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Authorization check
    if (course.instructor_id !== userId && userRole !== UserRole.ADMIN) {
      throw new Error('Not authorized to update this course');
    }

    CourseService.assertManualMeetingPlatform(data);

    const isUpdated = await Course.update(courseId, data);
    if (!isUpdated) {
      throw new Error('Failed to update course');
    }

    const updatedCourse = await Course.findById(courseId);
    if (!updatedCourse) {
      throw new Error('Failed to fetch updated course');
    }

    return updatedCourse;
  }

  /**
   * Delete course with authorization check
   */
  static async deleteCourse(userId: number, userRole: UserRole, courseId: number): Promise<void> {
    // Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error('Course not found');
    }

    // Authorization check
    if (course.instructor_id !== userId && userRole !== UserRole.ADMIN) {
      throw new Error('Not authorized to delete this course');
    }

    const isDeleted = await Course.delete(courseId);
    if (!isDeleted) {
      throw new Error('Failed to delete course');
    }
  }
}
