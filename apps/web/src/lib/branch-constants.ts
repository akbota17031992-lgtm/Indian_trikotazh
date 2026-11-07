import { ALMATY_STORES_SEED, type AlmatyStoreSeed } from '@india-trikotaj/shared';

export interface StoreBranch extends AlmatyStoreSeed {
  id: string;
}

// Map the 16 seed stores with canonical store-almaty-XXX IDs
export const ALL_BRANCHES: StoreBranch[] = ALMATY_STORES_SEED.map((s, idx) => ({
  ...s,
  id: `store-almaty-${String(idx + 1).padStart(3, '0')}`,
}));

export const DEFAULT_BRANCH: StoreBranch = ALL_BRANCHES[0]!; // MEGA Alma-Ata (store-almaty-001)

export const BRANCH_COOKIE_NAME = 'indiatrikotaj_branch_id';
export const STORAGE_BRANCHES_KEY = 'indiatrikotaj_admin_branches';

export function getStoredBranches(): StoreBranch[] {
  if (typeof window === 'undefined') return ALL_BRANCHES;
  try {
    const raw = localStorage.getItem(STORAGE_BRANCHES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse stored branches', e);
  }
  return ALL_BRANCHES;
}

export function saveStoredBranches(branches: StoreBranch[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_BRANCHES_KEY, JSON.stringify(branches));
  } catch (e) {
    console.error('Failed to save stored branches', e);
  }
}

export function resolveBranch(idOrSlug?: string | null): StoreBranch {
  const branches = getStoredBranches();
  if (!idOrSlug) return branches[0] || DEFAULT_BRANCH;
  const found = branches.find(b => b.id === idOrSlug || b.slug === idOrSlug);
  return found || branches[0] || DEFAULT_BRANCH;
}

export function formatBranchCookieHeader(branchId: string, maxAgeSeconds = 2592000): string {
  return `${BRANCH_COOKIE_NAME}=${branchId}; Path=/; Max-Age=${maxAgeSeconds}; SameSite=Lax`;
}

export function formatTelLink(phone: string): string {
  const cleanPhone = phone.replace(/[^+\d]/g, '');
  return `tel:${cleanPhone}`;
}

export function formatGoogleMapsUrl(latitude: number, longitude: number): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

