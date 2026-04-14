import { describe, it, expect } from 'vitest';
import { POLICIES } from '@/lib/authorization/policies';
import { UserRole, type IUser, type ICourse } from '@/types';

const admin: Pick<IUser, 'id' | 'role'> = { id: 1, role: UserRole.ADMIN };
const instructor: Pick<IUser, 'id' | 'role'> = { id: 2, role: UserRole.INSTRUCTOR };
const student: Pick<IUser, 'id' | 'role'> = { id: 3, role: UserRole.STUDENT };
const course: ICourse = {
  id: 10,
  title: 'Test',
  description: null,
  instructor_id: instructor.id,
  price: 0,
  image_url: null,
  status: 'draft',
  slot_duration: 60,
  price_per_slot: 0,
  meeting_platform: 'manual',
  meeting_link: null,
  currency: 'EGP',
  created_at: new Date(),
};

describe('POLICIES', () => {
  it('allows admin to update/delete any course', () => {
    expect(POLICIES['course:update'](admin, course)).toBe(true);
    expect(POLICIES['course:delete'](admin, course)).toBe(true);
  });

  it('allows instructor to update/delete own course, not others', () => {
    expect(POLICIES['course:update'](instructor, course)).toBe(true);
    expect(POLICIES['course:delete'](instructor, course)).toBe(true);
    const otherCourse = { ...course, instructor_id: 999 };
    expect(POLICIES['course:update'](instructor, otherCourse)).toBe(false);
  });

  it('student cannot update/delete courses', () => {
    expect(POLICIES['course:update'](student, course)).toBe(false);
    expect(POLICIES['course:delete'](student, course)).toBe(false);
  });

  it('enroll policy allows only students', () => {
    expect(POLICIES['course:enroll'](student, undefined)).toBe(true);
    expect(POLICIES['course:enroll'](admin, undefined)).toBe(false);
  });
});
