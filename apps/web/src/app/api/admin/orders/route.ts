import { NextResponse } from 'next/server';
import { ALL_BRANCHES } from '@/lib/branch-constants';

export interface AdminOrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalKzt: number;
  status: 'pending' | 'paid' | 'processing' | 'ready_for_pickup' | 'in_transit' | 'delivered' | 'cancelled';
  fulfillmentType: 'pickup' | 'courier';
  pickupStoreId?: string;
  pickupStoreNameRu?: string;
  pickupStoreNameKz?: string;
  deliveryAddress?: string;
  itemsCount: number;
  itemsSummaryRu: string;
  paymentMethod: 'kaspi_qr' | 'kaspi_red' | 'kaspi_gold';
  createdAt: string;
}

// In-memory demo orders for store managers & admin
let liveOrders: AdminOrderItem[] = [
  {
    id: 'ord-1001',
    orderNumber: 'KZ-2026-0089',
    customerName: 'Айгерим Смагулова',
    customerPhone: '+7 (777) 345-67-89',
    totalKzt: 14500,
    status: 'paid',
    fulfillmentType: 'pickup',
    pickupStoreId: 'store-almaty-001',
    pickupStoreNameRu: 'MEGA Alma-Ata',
    pickupStoreNameKz: 'MEGA Alma-Ata СОО',
    itemsCount: 2,
    itemsSummaryRu: 'Футболка оверсайз (M), Пижамный комплект (L)',
    paymentMethod: 'kaspi_qr',
    createdAt: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-1002',
    orderNumber: 'KZ-2026-0090',
    customerName: 'Руслан Ахметов',
    customerPhone: '+7 (701) 900-11-22',
    totalKzt: 28900,
    status: 'processing',
    fulfillmentType: 'courier',
    deliveryAddress: 'г. Алматы, Медеуский р-н, ул. Достык 120, кв 45',
    itemsCount: 3,
    itemsSummaryRu: 'Туника индийский батист, Набор полотенец махровых (2)',
    paymentMethod: 'kaspi_red',
    createdAt: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-1003',
    orderNumber: 'KZ-2026-0091',
    customerName: 'Данияр Бауыржанов',
    customerPhone: '+7 (705) 555-44-33',
    totalKzt: 9500,
    status: 'ready_for_pickup',
    fulfillmentType: 'pickup',
    pickupStoreId: 'store-almaty-002',
    pickupStoreNameRu: 'Dostyk Plaza',
    pickupStoreNameKz: 'Dostyk Plaza СОО',
    itemsCount: 1,
    itemsSummaryRu: 'Домашний комплект пижамы из трикотажа',
    paymentMethod: 'kaspi_qr',
    createdAt: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
  },
  {
    id: 'ord-1004',
    orderNumber: 'KZ-2026-0092',
    customerName: 'Мадина Жумабаева',
    customerPhone: '+7 (707) 123-99-88',
    totalKzt: 4500,
    status: 'delivered',
    fulfillmentType: 'pickup',
    pickupStoreId: 'store-almaty-003',
    pickupStoreNameRu: 'Тастак-2 (ул. Толе би 259)',
    pickupStoreNameKz: 'Тастақ-2 (Төле би к-сі 259)',
    itemsCount: 1,
    itemsSummaryRu: 'Мужская базовая футболка (хлопок 100%)',
    paymentMethod: 'kaspi_gold',
    createdAt: new Date(Date.now() - 360 * 60 * 1000).toISOString(),
  },
];

function isAuthorizedStaff(req: Request): boolean {
  const auth = req.headers.get('authorization') || '';
  const referer = req.headers.get('referer') || '';
  if (auth.includes('admin') || auth.includes('manager') || auth.includes('superadmin') || auth.includes('mock-admin-token')) {
    return true;
  }
  if (referer.includes('/admin')) {
    return true;
  }
  return false;
}

export async function GET(req: Request) {
  if (!isAuthorizedStaff(req)) {
    return NextResponse.json({ error: 'Доступ запрещен. Требуется авторизация администратора.' }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('storeId');
  const status = searchParams.get('status');

  let filtered = [...liveOrders];

  if (storeId && storeId !== 'all') {
    filtered = filtered.filter(o => o.pickupStoreId === storeId || o.fulfillmentType === 'courier');
  }

  if (status && status !== 'all') {
    filtered = filtered.filter(o => o.status === status);
  }

  return NextResponse.json({
    orders: filtered,
    total: filtered.length,
    totalRevenueKzt: liveOrders.reduce((acc, o) => (o.status !== 'cancelled' ? acc + o.totalKzt : acc), 0),
  });
}

export async function PATCH(req: Request) {
  if (!isAuthorizedStaff(req)) {
    return NextResponse.json({ error: 'Доступ запрещен. Требуется авторизация администратора.' }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { id, newStatus } = body;

    const order = liveOrders.find(o => o.id === id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    order.status = newStatus;
    return NextResponse.json({ success: true, order });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

