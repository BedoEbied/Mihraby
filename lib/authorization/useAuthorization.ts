'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { POLICIES, Policy, PolicyResourceMap } from './policies';

export const useAuthorization = () => {
  const { user } = useAuth();

  const checkAccess = <P extends Policy>(policy: P, resource: PolicyResourceMap[P]): boolean => {
    if (!user) return false;
    
    const policyFn = POLICIES[policy];
    if (!policyFn) {
      console.warn(`Policy "${policy}" not found`);
      return false;
    }
    
    return policyFn({ id: user.id, role: user.role }, resource);
  };

  return {
    checkAccess,
    user,
    role: user?.role,
  };
};
