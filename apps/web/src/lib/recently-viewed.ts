'use client';

const RECENTLY_VIEWED_KEY = 'indiatrikotaj_recently_viewed_ids';

export function saveRecentlyViewedProduct(productId: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    let list: string[] = raw ? JSON.parse(raw) : [];
    // Remove if already exists and prepend to front
    list = list.filter(id => id !== productId);
    list.unshift(productId);
    // Keep max 15 products
    list = list.slice(0, 15);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Failed to save recently viewed', e);
  }
}

export function getRecentlyViewedProductIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENTLY_VIEWED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

