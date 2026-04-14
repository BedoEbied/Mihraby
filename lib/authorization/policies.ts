import { UserRole, IUser, ICourse } from '@/types';

export type Policy = 
  | 'course:create'
  | 'course:update'
  | 'course:delete'
  | 'course:enroll'
  | 'course:unenroll'
  | 'course:view-all'
  | 'user:manage'
  | 'user:delete'
  | 'user:update-role'
  | 'enrollment:manage'
  | 'admin:access';

type AuthUser = Pick<IUser, 'id' | 'role'>;

export type PolicyResourceMap = {
  'course:create': undefined;
  'course:update': ICourse | undefined;
  'course:delete': ICourse | undefined;
  'course:enroll': undefined;
  'course:unenroll': undefined;
  'course:view-all': undefined;
  'user:manage': undefined;
  'user:delete': AuthUser | undefined;
  'user:update-role': undefined;
  'enrollment:manage': { userId: number } | undefined;
  'admin:access': undefined;
};

type PolicyHandler<P extends Policy> = (user: AuthUser, resource: PolicyResourceMap[P]) => boolean;

export const POLICIES: { [P in Policy]: PolicyHandler<P> } = {
  // Course policies
  'course:create': (user) => [UserRole.INSTRUCTOR, UserRole.ADMIN].includes(user.role),
  
  'course:update': (user, course) =>
    user.role === UserRole.ADMIN ||
    (user.role === UserRole.INSTRUCTOR && !!course && course.instructor_id === user.id),
  
  'course:delete': (user, course) =>
    user.role === UserRole.ADMIN ||
    (user.role === UserRole.INSTRUCTOR && !!course && course.instructor_id === user.id),
  
  'course:enroll': (user) => user.role === UserRole.STUDENT,
  
  'course:unenroll': (user) => user.role === UserRole.STUDENT,
  
  'course:view-all': (user) => [UserRole.INSTRUCTOR, UserRole.ADMIN].includes(user.role),
  
  // User management policies
  'user:manage': (user) => [UserRole.ADMIN, UserRole.INSTRUCTOR].includes(user.role),
  
  'user:delete': (user, target) => user.role === UserRole.ADMIN && target?.id !== user.id,
  
  'user:update-role': (user) => [UserRole.ADMIN, UserRole.INSTRUCTOR].includes(user.role),
  
  // Enrollment policies
  'enrollment:manage': (user, enrollment) =>
    user.role === UserRole.ADMIN ||
    user.role === UserRole.INSTRUCTOR ||
    (!!enrollment && enrollment.userId === user.id),
  
  // Admin access
  'admin:access': (user) => [UserRole.ADMIN, UserRole.INSTRUCTOR].includes(user.role),
};
