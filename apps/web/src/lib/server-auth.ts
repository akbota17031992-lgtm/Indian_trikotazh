import { INITIAL_ADMIN_ACCOUNTS, type AdminAccount } from './admin-roles-data';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const memoryRateLimitStore = new Map<string, RateLimitEntry>();

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();
  return 'unknown-client';
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetSeconds: number } {
  const now = Date.now();
  let entry = memoryRateLimitStore.get(key);

  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    memoryRateLimitStore.set(key, entry);
  } else {
    entry.count += 1;
  }

  const remaining = Math.max(0, limit - entry.count);
  const resetSeconds = Math.ceil((entry.resetAt - now) / 1000);

  // Periodically clean stale entries if map exceeds 5000 items
  if (memoryRateLimitStore.size > 5000) {
    for (const [k, e] of memoryRateLimitStore.entries()) {
      if (now > e.resetAt) memoryRateLimitStore.delete(k);
    }
  }

  return {
    allowed: entry.count <= limit,
    remaining,
    resetSeconds,
  };
}

export function verifyStaffAuth(req: Request): {
  isAuthorized: boolean;
  account?: AdminAccount | null;
  error?: string;
} {
  const authHeader = req.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      isAuthorized: false,
      error: 'Требуется авторизация сотрудника (Bearer токен отсутствует)',
    };
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    return {
      isAuthorized: false,
      error: 'Недействительный токен авторизации',
    };
  }

  // Master demo/admin token
  if (token === 'mock-admin-token') {
    return {
      isAuthorized: true,
      account: INITIAL_ADMIN_ACCOUNTS[0],
    };
  }

  // Structured staff session token: mock-customer-token-<base64> or mock-staff-token-<base64>
  if (token.startsWith('mock-')) {
    const parts = token.split('-');
    if (parts.length >= 3) {
      try {
        const base64Payload = parts.slice(parts.length - 1).join('');
        const jsonStr = Buffer.from(base64Payload, 'base64').toString('utf-8');
        const parsed = JSON.parse(jsonStr);

        if (
          parsed &&
          (parsed.role === 'admin' ||
            parsed.role === 'superadmin' ||
            parsed.role === 'store_manager' ||
            parsed.role === 'manager')
        ) {
          const matched = INITIAL_ADMIN_ACCOUNTS.find(
            a => a.id === parsed.id || a.login === parsed.login
          );
          return {
            isAuthorized: true,
            account: matched || {
              id: parsed.id || 'admin-dynamic',
              login: parsed.login || 'staff',
              passwordHash: '',
              name: parsed.fullName || parsed.name || 'Сотрудник сети',
              role: parsed.role,
              email: parsed.email || 'staff@indiatrikotaj.kz',
              phone: parsed.phone || '+7 (701) 999-00-01',
              avatarBg: 'bg-amber-600',
              createdAt: new Date().toISOString(),
              isActive: true,
            },
          };
        }
      } catch {
        // Fall through to unauthorized
      }
    }
  }

  return {
    isAuthorized: false,
    error: 'Недостаточно прав доступа или сессия истекла',
  };
}
