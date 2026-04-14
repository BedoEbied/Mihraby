import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CourseService } from '@/lib/services/courseService';
import { UserRole } from '@/types';

vi.mock('@/lib/db/models/Course', () => ({
  Course: {
    findById: vi.fn(async (id: number) =>
      id === 1 ? { id: 1, instructor_id: 2, title: 't', description: null, price: 0, image_url: null, status: 'draft', created_at: new Date() } : null
    ),
    update: vi.fn(async () => true),
    delete: vi.fn(async () => true),
  },
}));

const { Course } = await import('@/lib/db/models/Course');

describe('CourseService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws when updating missing course', async () => {
    await expect(
      CourseService.updateCourse(2, UserRole.INSTRUCTOR, 999, {})
    ).rejects.toThrow('Course not found');
  });

  it('prevents unauthorized update', async () => {
    await expect(
      CourseService.updateCourse(999, UserRole.INSTRUCTOR, 1, {})
    ).rejects.toThrow('Not authorized');
  });

  it('allows admin delete', async () => {
    await expect(
      CourseService.deleteCourse(10, UserRole.ADMIN, 1)
    ).resolves.toBeUndefined();
    expect(Course.delete).toHaveBeenCalled();
  });
});
