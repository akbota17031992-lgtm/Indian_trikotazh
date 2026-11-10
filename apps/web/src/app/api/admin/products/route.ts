import { NextResponse } from 'next/server';
import { CATALOG_PRODUCTS } from '@/lib/catalog-data';
import { ALL_BRANCHES } from '@/lib/branch-constants';
import { verifyStaffAuth } from '@/lib/server-auth';

export interface AdminProductItem {
  id: string;
  slug: string;
  nameRu: string;
  nameKz: string;
  categorySlug: string;
  basePriceKzt: number;
  discountPriceKzt?: number;
  imageUrl: string;
  images?: string[];
  compositionRu: string;
  compositionKz: string;
  descriptionRu?: string;
  descriptionKz?: string;
  isPublished: boolean;
  stockByBranch: Record<string, number>;
  totalStock: number;
}

// In-memory store for interactive admin operations
let liveProducts: AdminProductItem[] = CATALOG_PRODUCTS.map((p, idx) => {
  const stockMap: Record<string, number> = {};
  ALL_BRANCHES.forEach((b, bIdx) => {
    stockMap[b.id] = 5 + ((idx * 7 + bIdx * 3) % 25);
  });
  const total = Object.values(stockMap).reduce((acc, v) => acc + v, 0);

  return {
    id: p.id,
    slug: p.slug,
    nameRu: p.nameRu,
    nameKz: p.nameKz,
    categorySlug: p.categorySlug,
    basePriceKzt: p.basePriceKzt,
    discountPriceKzt: undefined,
    imageUrl: p.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
    compositionRu: p.materialRu || '100% индийский хлопок',
    compositionKz: p.materialKz || '100% үнді мақтасы',
    isPublished: true,
    stockByBranch: stockMap,
    totalStock: total,
  };
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search')?.toLowerCase();
  const branchId = searchParams.get('branchId');

  let filtered = [...liveProducts];

  if (category && category !== 'all') {
    filtered = filtered.filter(p => p.categorySlug === category);
  }

  if (search) {
    filtered = filtered.filter(
      p =>
        p.nameRu.toLowerCase().includes(search) ||
        p.nameKz.toLowerCase().includes(search) ||
        p.slug.toLowerCase().includes(search)
    );
  }

  if (branchId) {
    filtered = filtered.filter(p => (p.stockByBranch[branchId] ?? 0) > 0);
  }

  return NextResponse.json({
    products: filtered,
    total: filtered.length,
    branchesCount: ALL_BRANCHES.length,
  });
}

export async function POST(req: Request) {
  const auth = verifyStaffAuth(req);
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: 'Доступ запрещен. Требуется авторизация сотрудника сети.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const newProduct: AdminProductItem = {
      id: body.id || `prod-${Date.now()}`,
      slug: body.slug || `item-${Date.now()}`,
      nameRu: body.nameRu || 'Новый товар',
      nameKz: body.nameKz || 'Жаңа тауар',
      categorySlug: body.categorySlug || 't-shirts',
      basePriceKzt: Number(body.basePriceKzt) || 5000,
      discountPriceKzt: body.discountPriceKzt ? Number(body.discountPriceKzt) : undefined,
      imageUrl: body.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80',
      images: Array.isArray(body.images) && body.images.length > 0 ? body.images : [body.imageUrl || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80'],
      compositionRu: body.compositionRu || '100% индийский хлопок',
      compositionKz: body.compositionKz || '100% үнді мақтасы',
      descriptionRu: body.descriptionRu || '',
      descriptionKz: body.descriptionKz || '',
      isPublished: body.isPublished !== false,
      stockByBranch: body.stockByBranch || {},
      totalStock: Object.values(body.stockByBranch || {}).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0) as number,
    };

    const existingIdx = liveProducts.findIndex(p => p.id === newProduct.id);
    if (existingIdx !== -1) {
      liveProducts[existingIdx] = { ...liveProducts[existingIdx]!, ...newProduct };
    } else {
      liveProducts.unshift(newProduct);
    }
    return NextResponse.json({ success: true, product: newProduct }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  const auth = verifyStaffAuth(req);
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: 'Доступ запрещен. Требуется авторизация сотрудника сети.' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { id, updates } = body;
    if (!id) {
      return NextResponse.json({ error: 'Идентификатор товара обязателен' }, { status: 400 });
    }

    const index = liveProducts.findIndex(p => p.id === id);
    if (index === -1) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    const existing = liveProducts[index]!;
    const updated: AdminProductItem = {
      ...existing,
      ...updates,
      stockByBranch: updates.stockByBranch || existing.stockByBranch,
      totalStock: updates.stockByBranch
        ? (Object.values(updates.stockByBranch).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0) as number)
        : existing.totalStock,
    };

    liveProducts[index] = updated;
    return NextResponse.json({ success: true, product: updated });
  } catch {
    return NextResponse.json({ error: 'Некорректный запрос' }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const auth = verifyStaffAuth(req);
  if (!auth.isAuthorized) {
    return NextResponse.json(
      { error: 'Доступ запрещен. Требуется авторизация сотрудника сети.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'Идентификатор товара обязателен' }, { status: 400 });
  }

  liveProducts = liveProducts.filter(p => p.id !== id);
  return NextResponse.json({ success: true, remaining: liveProducts.length });
}
