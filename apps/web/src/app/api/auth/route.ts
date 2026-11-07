import { NextResponse } from 'next/server';
import { validateKazakhstanPhone } from '@india-trikotaj/shared';
import { INITIAL_CUSTOMERS, INITIAL_ADMIN_ACCOUNTS } from '@/lib/admin-roles-data';

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
    const body = await req.json();
    const { action, phone, code, fullName, email, existingCustomer } = body;

    // 1. REQUEST SMS OTP CODE
    if (action === 'send_otp') {
      if (!phone || !validateKazakhstanPhone(phone)) {
        return NextResponse.json(
          { error: 'Введите корректный номер телефона Республики Казахстан (+7 7XX XXX XX XX)' },
          { status: 400 }
        );
      }

      const digits = getCleanPhoneDigits(phone);
      const existingUser = registeredUsers.find(u => getCleanPhoneDigits(u.phone) === digits);

      // Demo SMS code is always 7777 or last 4 digits
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

      // If client supplied custom customer (e.g. from CRM / staff accounts in localStorage), it takes priority!
      if (existingCustomer && existingCustomer.name) {
        if (user) {
          user.fullName = existingCustomer.name;
          if (existingCustomer.email) user.email = existingCustomer.email;
          if (existingCustomer.role) user.role = existingCustomer.role;
        } else {
          user = {
            id: existingCustomer.id || `usr-${Date.now()}`,
            phone: phone.trim(),
            fullName: existingCustomer.name,
            email: existingCustomer.email || undefined,
            role: existingCustomer.role || 'customer',
            bonusesKzt: existingCustomer.bonusBalance ?? 1000,
            ordersCount: existingCustomer.ordersCount ?? 0,
          };
          registeredUsers.push(user);
        }
      }

      const isNewUser = !user;

      if (!user) {
        // Register brand new customer
        user = {
          id: `usr-${Date.now()}`,
          phone: phone.trim(),
          fullName: fullName && fullName.trim().length >= 2 ? fullName.trim() : 'Покупатель сети',
          email: email?.trim() || undefined,
          role: 'customer',
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
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  // Returns currently mock-registered users count
  return NextResponse.json({
    totalCustomers: registeredUsers.length,
    users: registeredUsers,
  });
}
