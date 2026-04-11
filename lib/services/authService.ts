import { User } from '@/lib/db/models/User';
import { hashPassword, comparePassword, generateToken } from '@/lib/auth/server';
import { RegisterDTO, UserRole, UserWithoutPassword } from '@/types';

/**
 * Authentication Service - Pure business logic
 */
export class AuthService {
  /**
   * Register new user
   */
  static async register(data: RegisterDTO): Promise<{ token: string; user: UserWithoutPassword }> {
    const { email, password, name } = data;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const newUser = await User.create({
      email,
      password: hashedPassword,
      name,
      // Self-registration is always a student. Elevated roles must be assigned by admins.
      role: UserRole.STUDENT
    });

    // Generate token
    const token = generateToken(newUser.id, newUser.email, newUser.role);

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      token,
      user: userWithoutPassword
    };
  }

  /**
   * Login user
   */
  static async login(email: string, password: string): Promise<{ token: string; user: UserWithoutPassword }> {
    // Find user
    const user = await User.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Generate token
    const token = generateToken(user.id, user.email, user.role);

    // Return user without password
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: userWithoutPassword
    };
  }

  /**
   * Get current user by ID
   */
  static async getCurrentUser(userId: number): Promise<UserWithoutPassword> {
    const user = await User.findByIdWithoutPassword(userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}
