/**
 * India Trikotaj — Test Auth Helpers & Mock Tokens
 * Provides test authorization headers and tokens for RBAC & RLS validation.
 */

export interface TestUserContext {
  id: string;
  role: 'anonymous' | 'customer' | 'store_manager' | 'admin';
  phone?: string;
  email?: string;
  assignedStoreId?: string;
  storeId?: string;
}

export const TEST_USERS: Record<string, TestUserContext> = {
  anonymous: {
    id: '',
    role: 'anonymous',
  },
  customerAlice: {
    id: 'usr-alice',
    role: 'customer',
    phone: '+7 (701) 123-45-67',
    email: 'alice@example.kz',
  },
  customerBob: {
    id: 'usr-bob',
    role: 'customer',
    phone: '+7 (702) 987-65-43',
    email: 'bob@example.kz',
  },
  managerMega: {
    id: 'usr-mgr-mega',
    role: 'store_manager',
    email: 'mega.manager@india-trikotaj.kz',
    assignedStoreId: 'store-almaty-001',
    storeId: 'store-almaty-001',
  },
  managerDostyk: {
    id: 'usr-mgr-dostyk',
    role: 'store_manager',
    email: 'dostyk.manager@india-trikotaj.kz',
    assignedStoreId: 'store-almaty-002',
    storeId: 'store-almaty-002',
  },
  adminRoot: {
    id: 'usr-admin-root',
    role: 'admin',
    email: 'root.admin@india-trikotaj.kz',
  },
};

export function getAuthHeader(userKey: keyof typeof TEST_USERS): Record<string, string> {
  const user = TEST_USERS[userKey];
  if (!user || user.role === 'anonymous') {
    return {};
  }

  // Structured base64 token for deterministic test decoding
  const tokenPayload = Buffer.from(JSON.stringify(user)).toString('base64');
  return {
    Authorization: `Bearer mock-${user.role}-${tokenPayload}`,
  };
}
