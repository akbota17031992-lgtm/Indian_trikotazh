import { NextResponse } from 'next/server';
import { validateKazakhstanPhone } from '@india-trikotaj/shared';
import { INITIAL_CUSTOMERS, INITIAL_ADMIN_ACCOUNTS } from '@/lib/admin-roles-data';
import { checkRateLimit, getClientIp, verifyStaffAuth } from '@/lib/server-auth';

export interface UserSession {
  id: string;
  phone: string;
  fullName: string;
  email?: string;
  role: 'customer' | 'store_manager' | 'admin';
  assignedStoreId?: string;
  bonusesKzt: number;
  ordersCount: number;
}

const getCleanPhoneDigits = (phone: string | null | undefined): string => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
};

// Seed in-memory registered users with INITIAL_CUSTOMERS and INITIAL_ADMIN_ACCOUNTS
let registeredUsers: UserSession[] = [
  ...INITIAL_CUSTOMERS.map(c => ({
    id: c.id,
    phone: c.phone,
    fullName: c.name,
    email: c.email,
    role: 'customer' as const,
    bonusesKzt: c.bonusBalance,
    ordersCount: c.ordersCount,
  })),
  ...INITIAL_ADMIN_ACCOUNTS.map(a => ({
    id: a.id,
    phone: a.phone,
    fullName: a.name,
    email: a.email,
    role: (a.role === 'manager' ? 'store_manager' : 'admin') as 'customer' | 'store_manager' | 'admin',
    bonusesKzt: 500,
    ordersCount: 0,
  })),
  {
    id: 'usr-demo-01',
    phone: '+7 (701) 000-11-22',
    fullName: 'Алиса Сапарова',
    email: 'alice@example.kz',
    role: 'customer',
    bonusesKzt: 2500,
    ordersCount: 3,
  },
  {
    id: 'usr-demo-02',
    phone: '+7 (777) 000-33-44',
    fullName: 'Кайрат Нуртасов',
    email: 'kairat@example.kz',
    role: 'customer',
    bonusesKzt: 1000,
    ordersCount: 1,
  },
];

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const body = await req.json();
    const { action, phone, code, fullName, email, existingCustomer } = body;

    // 1. REQUEST SMS OTP CODE (Protected with Rate Limiting against SMS Toll Fraud / DoS)
    if (action === 'send_otp') {
      if (!phone || !validateKazakhstanPhone(phone)) {
        return NextResponse.json(
          { error: 'Введите корректный номер телефона Республики Казахстан (+7 7XX XXX XX XX)' },
          { status: 400 }
        );
      }

      // Check Rate Limit: max 5 OTP requests per 10 minutes per IP/Phone
      const digits = getCleanPhoneDigits(phone);
      const rateLimitKey = `otp:${ip}:${digits}`;
      const rateCheck = checkRateLimit(rateLimitKey, 5, 10 * 60 * 1000);

      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            error: `Слишком много запросов кода. Пожалуйста, повторите попытку через ${rateCheck.resetSeconds} сек.`,
          },
          {
            status: 429,
            headers: {
              'Retry-After': rateCheck.resetSeconds.toString(),
            },
          }
        );
      }

      const existingUser = registeredUsers.find(u => getCleanPhoneDigits(u.phone) === digits);
      const demoCode = '7777';

      return NextResponse.json({
        success: true,
        message: 'SMS-код отправлен',
        demoOtpCode: demoCode,
        isRegistered: Boolean(existingUser || existingCustomer),
        registeredName: existingUser?.fullName || existingCustomer?.name || null,
      });
    }

    // 2. VERIFY SMS OTP & LOGIN / REGISTER
    if (action === 'verify_otp' || action === 'register') {
      if (!phone || !validateKazakhstanPhone(phone)) {
        return NextResponse.json(
          { error: 'Неверный номер телефона' },
          { status: 400 }
        );
      }

      // Allow 7777 or any 4-digit code in demo mode
      if (code && code !== '7777' && code.length !== 4) {
        return NextResponse.json(
          { error: 'Неверный SMS-код. Введите 7777' },
          { status: 400 }
        );
      }

      const digits = getCleanPhoneDigits(phone);
      let user = registeredUsers.find(u => getCleanPhoneDigits(u.phone) === digits);

      // Verify if this phone belongs to pre-authorized staff
      const staffMatch = INITIAL_ADMIN_ACCOUNTS.find(a => getCleanPhoneDigits(a.phone) === digits);
      const authorizedRole = staffMatch ? (staffMatch.role === 'manager' ? 'store_manager' : 'admin') : 'customer';

      // If client supplied custom customer, prioritize name but sanitize role and bonuses
      if (existingCustomer && existingCustomer.name) {
        if (user) {
          user.fullName = existingCustomer.name;
          if (existingCustomer.email) user.email = existingCustomer.email;
          user.role = authorizedRole;
        } else {
          user = {
            id: existingCustomer.id || `usr-${Date.now()}`,
            phone: phone.trim(),
            fullName: existingCustomer.name,
            email: existingCustomer.email || undefined,
            role: authorizedRole,
            bonusesKzt: Math.min(Math.max(Number(existingCustomer.bonusBalance) || 1000, 0), 5000),
            ordersCount: Number(existingCustomer.ordersCount) || 0,
          };
          registeredUsers.push(user);
        }
      }

      const isNewUser = !user;

      if (!user) {
        user = {
          id: `usr-${Date.now()}`,
          phone: phone.trim(),
          fullName: fullName && fullName.trim().length >= 2 ? fullName.trim() : 'Покупатель сети',
          email: email?.trim() || undefined,
          role: authorizedRole,
          bonusesKzt: 1000, // 1 000 ₸ welcome bonus
          ordersCount: 0,
        };
        registeredUsers.push(user);
      } else if (fullName && fullName.trim().length >= 2 && fullName.trim() !== 'Покупатель сети') {
        user.fullName = fullName.trim();
        if (email) user.email = email.trim();
      }

      return NextResponse.json({
        success: true,
        isNewUser,
        user,
        token: `mock-customer-token-${Buffer.from(JSON.stringify(user)).toString('base64')}`,
      });
    }

    return NextResponse.json({ error: 'Неизвестное действие' }, { status: 400 });
  } catch (err: unknown) {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }
}

export async function GET(req: Request) {
  // Cryptographic staff token authorization check before returning customer PII
  const authCheck = verifyStaffAuth(req);

  if (authCheck.isAuthorized) {
    return NextResponse.json({
      totalCustomers: registeredUsers.length,
      users: registeredUsers,
    });
  }

  // Unauthenticated callers only receive aggregate count, zero PII
  return NextResponse.json({
    totalCustomers: registeredUsers.length,
  });
}
