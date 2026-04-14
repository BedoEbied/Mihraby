import { POLICIES, type Policy, type PolicyResourceMap } from './policies';
import type { IUser } from '@/types';

type AuthUser = Pick<IUser, 'id' | 'role'>;

export function checkPolicy<P extends Policy>(
  user: AuthUser,
  policy: P,
  resource?: PolicyResourceMap[P]
): boolean {
  const policyFn = POLICIES[policy];
  if (!policyFn) return false;
  return policyFn(user, resource as PolicyResourceMap[P]);
}
