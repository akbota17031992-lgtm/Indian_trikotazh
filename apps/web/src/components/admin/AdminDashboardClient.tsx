'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ALL_BRANCHES,
  type StoreBranch,
  STORAGE_BRANCHES_KEY,
  getStoredBranches,
  saveStoredBranches,
} from '@/lib/branch-constants';
import {
  formatKZT,
  validateKazakhstanPhone,
  formatKazakhstanPhone,
  formatPhoneInput,
  getPhoneDigits,
} from '@india-trikotaj/shared';
export { formatPhoneInput, getPhoneDigits };
import { AiProductIngest } from '@/components/admin/AiProductIngest';
import { AdminAuthGate } from '@/components/admin/AdminAuthGate';
import { SettingsIntegrationsTab } from './tabs/SettingsIntegrationsTab';
import { getStoredDynamicProducts } from '@/lib/products-store';
import {
  type AdminAccount,
  type AdminRole,
  type CustomerAccount,
  type PromoPromotion,
  INITIAL_ADMIN_ACCOUNTS,
  INITIAL_CUSTOMERS,
  INITIAL_PROMOTIONS,
} from '@/lib/admin-roles-data';
import {
  type IntegrationConfig,
  type IntegrationCategory,
  type IntegrationStatus,
  STORAGE_INTEGRATIONS_KEY,
  DEFAULT_INTEGRATIONS,
  getStoredIntegrations,
  saveStoredIntegrations,
} from '@/lib/integrations-config';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Store,
  Package,
  ShoppingBag,
  Users,
  Settings,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  RotateCcw,
  Plus,
  Trash2,
  Edit,
  ChevronDown,
  ArrowLeft,
  LayoutDashboard,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  MapPin,
  Phone,
  LogOut,
  Tag,
  Coins,
  UserCheck,
  UserX,
  PlusCircle,
  Percent,
  RefreshCw,
  Globe,
  Key,
  Lock,
  Copy,
  Check,
  Receipt,
  CreditCard,
  MessageSquare,
  Power,
  ExternalLink,
} from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  totalKzt: number;
  status: 'pending' | 'paid' | 'processing' | 'ready_for_pickup' | 'in_transit' | 'delivered' | 'cancelled';
  fulfillmentType: 'pickup' | 'courier';
  pickupStoreId?: string;
  pickupStoreNameRu?: string;
  deliveryAddress?: string;
  itemsSummaryRu?: string;
  paymentMethod?: 'kaspi_qr' | 'kaspi_red' | 'kaspi_gold';
  itemsCount?: number;
  createdAt: string;
}

interface ProductItem {
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
  compositionKz?: string;
  descriptionRu?: string;
  descriptionKz?: string;
  totalStock: number;
  stockByBranch: Record<string, number>;
  isPublished: boolean;
}

const STORAGE_ADMIN_SESSION_KEY = 'indiatrikotaj_admin_session';
const STORAGE_ADMIN_ACCOUNTS_KEY = 'indiatrikotaj_admin_accounts';
const STORAGE_CUSTOMERS_KEY = 'indiatrikotaj_admin_customers';
const STORAGE_PROMOTIONS_KEY = 'indiatrikotaj_admin_promos';

export function AdminDashboardClient() {
  // --- Admin Session State ---
  const [currentAccount, setCurrentAccount] = useState<AdminAccount | null>(null);
  const [accounts, setAccounts] = useState<AdminAccount[]>(INITIAL_ADMIN_ACCOUNTS);
  const [customers, setCustomers] = useState<CustomerAccount[]>(INITIAL_CUSTOMERS);
  const [promotions, setPromotions] = useState<PromoPromotion[]>(INITIAL_PROMOTIONS);
  const [isClientReady, setIsClientReady] = useState(false);

  // Active branch selector for multi-branch oversight
  const [activeBranchId, setActiveBranchId] = useState<string>('store-almaty-001');

  // Tabs:
  // - 'dashboard': overview (superadmin, admin)
  // - 'orders': order management (superadmin, admin)
  // - 'inventory': products & stock (superadmin, admin, manager)
  // - 'ai_ingest': AI product ingest (superadmin, admin, manager)
  // - 'promotions': sales & promo management (superadmin, admin, manager)
  // - 'customers': client accounts & bonus points (superadmin, admin)
  // - 'users': staff & roles (superadmin ONLY)
  // - 'branches': store locations (superadmin, admin)
  // - 'settings': Kaspi/OFD integrations (superadmin)
  const [activeTab, setActiveTab] = useState<string>('inventory');

  // Products & Orders state
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [orderFilterStatus, setOrderFilterStatus] = useState<string>('all');
  const [productSearch, setProductSearch] = useState<string>('');
  const [editingStockProduct, setEditingStockProduct] = useState<ProductItem | null>(null);
  const [productToEdit, setProductToEdit] = useState<ProductItem | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Bonus adjust modal state
  const [bonusModalCustomer, setBonusModalCustomer] = useState<CustomerAccount | null>(null);
  const [bonusDelta, setBonusDelta] = useState<number>(500);
  const [bonusReason, setBonusReason] = useState<string>('Компенсация задержки / сбоя начисления');

  // Customer Edit / Create Modal state
  const [customerModalData, setCustomerModalData] = useState<CustomerAccount | null>(null);
  const [isCreatingCustomer, setIsCreatingCustomer] = useState<boolean>(false);

  // Real-time duplicate customer checks for the modal
  const modalPhoneDigits = customerModalData ? getPhoneDigits(customerModalData.phone) : '';
  const duplicatePhoneCustomer =
    customerModalData && modalPhoneDigits.length === 10
      ? customers.find(
          c => c.id !== customerModalData.id && getPhoneDigits(c.phone) === modalPhoneDigits
        )
      : null;

  const modalEmailClean = customerModalData?.email?.trim().toLowerCase();
  const duplicateEmailCustomer =
    customerModalData && modalEmailClean
      ? customers.find(
          c =>
            c.id !== customerModalData.id &&
            c.email.trim().toLowerCase() === modalEmailClean
        )
      : null;

  // Duplicate phone map for highlighting duplicate customer rows in table
  const duplicatePhoneMap = React.useMemo(() => {
    const counts: Record<string, number> = {};
    customers.forEach(c => {
      const d = getPhoneDigits(c.phone);
      if (d.length === 10) {
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return counts;
  }, [customers]);

  // Staff Modal state (for Superadmin: create & edit)
  const [staffModalData, setStaffModalData] = useState<AdminAccount | null>(null);
  const [isCreatingStaff, setIsCreatingStaff] = useState<boolean>(false);
  const [staffPasswordInput, setStaffPasswordInput] = useState<string>('');

  // Real-time duplicate checks for staff modal
  const modalStaffLoginClean = staffModalData?.login?.trim().toLowerCase();
  const duplicateStaffLogin =
    staffModalData && modalStaffLoginClean
      ? accounts.find(
          a => a.id !== staffModalData.id && a.login.trim().toLowerCase() === modalStaffLoginClean
        )
      : null;

  const modalStaffPhoneDigits = staffModalData ? getPhoneDigits(staffModalData.phone) : '';
  const duplicateStaffPhone =
    staffModalData && modalStaffPhoneDigits.length === 10
      ? accounts.find(
          a => a.id !== staffModalData.id && getPhoneDigits(a.phone) === modalStaffPhoneDigits
        )
      : null;

  const modalStaffEmailClean = staffModalData?.email?.trim().toLowerCase();
  const duplicateStaffEmail =
    staffModalData && modalStaffEmailClean
      ? accounts.find(
          a => a.id !== staffModalData.id && a.email.trim().toLowerCase() === modalStaffEmailClean
        )
      : null;

  // Duplicate maps for staff table
  const duplicateStaffPhoneMap = React.useMemo(() => {
    const counts: Record<string, number> = {};
    accounts.forEach(a => {
      const d = getPhoneDigits(a.phone);
      if (d.length === 10) {
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return counts;
  }, [accounts]);

  const duplicateStaffEmailMap = React.useMemo(() => {
    const counts: Record<string, number> = {};
    accounts.forEach(a => {
      const em = a.email.trim().toLowerCase();
      if (em) {
        counts[em] = (counts[em] || 0) + 1;
      }
    });
    return counts;
  }, [accounts]);

  // Unified Promotion Modal state (for both creating and editing)
  const [promoModalData, setPromoModalData] = useState<PromoPromotion | null>(null);
  const [isCreatingPromo, setIsCreatingPromo] = useState<boolean>(false);

  // Branches (Stores of Almaty) state
  const [branches, setBranches] = useState<StoreBranch[]>(ALL_BRANCHES);
  const [branchModalData, setBranchModalData] = useState<StoreBranch | null>(null);
  const [isCreatingBranch, setIsCreatingBranch] = useState<boolean>(false);

  // Real-time duplicate checks for branch modal
  const modalBranchNameRuClean = branchModalData?.nameRu?.trim().toLowerCase();
  const duplicateBranchName =
    branchModalData && modalBranchNameRuClean
      ? branches.find(
          b =>
            b.id !== branchModalData.id &&
            b.nameRu.trim().toLowerCase() === modalBranchNameRuClean
        )
      : null;

  const modalBranchAddressRuClean = branchModalData?.addressRu?.trim().toLowerCase();
  const duplicateBranchAddress =
    branchModalData && modalBranchAddressRuClean
      ? branches.find(
          b =>
            b.id !== branchModalData.id &&
            b.addressRu.trim().toLowerCase() === modalBranchAddressRuClean
        )
      : null;

  const modalBranchPhoneDigits = branchModalData ? getPhoneDigits(branchModalData.phone) : '';
  const duplicateBranchPhone =
    branchModalData && modalBranchPhoneDigits.length === 10
      ? branches.find(
          b =>
            b.id !== branchModalData.id &&
            getPhoneDigits(b.phone) === modalBranchPhoneDigits
        )
      : null;

  const modalBranchSlugClean = branchModalData?.slug?.trim().toLowerCase();
  const duplicateBranchSlug =
    branchModalData && modalBranchSlugClean
      ? branches.find(
          b =>
            b.id !== branchModalData.id &&
            b.slug.trim().toLowerCase() === modalBranchSlugClean
        )
      : null;

  // Duplicate maps for branch cards in grid
  const duplicateBranchPhoneMap = React.useMemo(() => {
    const counts: Record<string, number> = {};
    branches.forEach(b => {
      const d = getPhoneDigits(b.phone);
      if (d.length === 10) {
        counts[d] = (counts[d] || 0) + 1;
      }
    });
    return counts;
  }, [branches]);

  const duplicateBranchAddressMap = React.useMemo(() => {
    const counts: Record<string, number> = {};
    branches.forEach(b => {
      const addr = b.addressRu.trim().toLowerCase();
      if (addr) {
        counts[addr] = (counts[addr] || 0) + 1;
      }
    });
    return counts;
  }, [branches]);

  const duplicateBranchNameMap = React.useMemo(() => {
    const counts: Record<string, number> = {};
    branches.forEach(b => {
      const name = b.nameRu.trim().toLowerCase();
      if (name) {
        counts[name] = (counts[name] || 0) + 1;
      }
    });
    return counts;
  }, [branches]);

  // Integrations & Gateways (Kaspi Pay, WebKassa, 1C, Gemini, SMSC, Delivery)
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>(DEFAULT_INTEGRATIONS);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    try {
      let loadedAccounts = INITIAL_ADMIN_ACCOUNTS;
      const savedAccounts = localStorage.getItem(STORAGE_ADMIN_ACCOUNTS_KEY);
      if (savedAccounts) {
        try {
          const parsed = JSON.parse(savedAccounts);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Deduplicate: preserve base 3 roles, then add custom staff accounts
            const deduped: AdminAccount[] = [...INITIAL_ADMIN_ACCOUNTS];
            parsed.forEach((acc: AdminAccount) => {
              const baseIndex = deduped.findIndex(
                b => b.login.toLowerCase() === acc.login?.toLowerCase() || b.id === acc.id
              );
              if (baseIndex >= 0) {
                // Keep preset role structure intact
                deduped[baseIndex] = { ...deduped[baseIndex], ...acc, role: deduped[baseIndex].role };
              } else if (acc && acc.login) {
                deduped.push(acc);
              }
            });
            loadedAccounts = deduped;
            setAccounts(loadedAccounts);
          }
        } catch {
          // fallback
        }
      }

      // Check active storefront customer session to prevent cross-account session leaks
      let activeCustomerUser: any = null;
      try {
        const rawCust = localStorage.getItem('indiatrikotaj_customer_user');
        if (rawCust) activeCustomerUser = JSON.parse(rawCust);
      } catch {}

      // 1. If active user on site is a retail customer, clear any stale admin session
      if (activeCustomerUser && activeCustomerUser.role === 'customer') {
        localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
        setCurrentAccount(null);
      } else if (activeCustomerUser && (activeCustomerUser.role === 'admin' || activeCustomerUser.role === 'store_manager')) {
        // 2. If active user on site is a staff member, synchronize dashboard directly to their account
        const staffDigits = getPhoneDigits(activeCustomerUser.phone).slice(-10);
        const matchedStaff = loadedAccounts.find(
          a => (staffDigits && getPhoneDigits(a.phone).slice(-10) === staffDigits) ||
               (activeCustomerUser.email && a.email?.toLowerCase() === activeCustomerUser.email.toLowerCase()) ||
               (activeCustomerUser.id && (a.id === activeCustomerUser.id || `cust-staff-${a.id}` === activeCustomerUser.id))
        );
        if (matchedStaff && matchedStaff.isActive) {
          setCurrentAccount(matchedStaff);
          localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(matchedStaff));
        }
      } else {
        // 3. Fallback: Verify saved admin session against current active staff accounts
        const savedSession = localStorage.getItem(STORAGE_ADMIN_SESSION_KEY);
        if (savedSession) {
          try {
            const parsedSession: AdminAccount = JSON.parse(savedSession);
            const matched = loadedAccounts.find(a => a.id === parsedSession.id && a.isActive);
            if (matched) {
              setCurrentAccount(matched);
            } else {
              localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
              setCurrentAccount(null);
            }
          } catch {
            localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
            setCurrentAccount(null);
          }
        }
      }

      let loadedCustomers: CustomerAccount[] = INITIAL_CUSTOMERS;
      const savedCustomers = localStorage.getItem(STORAGE_CUSTOMERS_KEY);
      if (savedCustomers) {
        try {
          const parsed = JSON.parse(savedCustomers);
          if (Array.isArray(parsed)) {
            loadedCustomers = parsed.map((c: CustomerAccount) => ({
              ...c,
              phone: formatKazakhstanPhone(c.phone) || c.phone,
            }));
          }
        } catch {
          // fallback
        }
      }

      // Self-healing sync: Ensure any registered staff account appears in the customer database
      const missingStaffAsCustomers: CustomerAccount[] = [];
      loadedAccounts.forEach(acc => {
        const accPhoneDigits = getPhoneDigits(acc.phone);
        const accEmail = acc.email?.trim().toLowerCase();
        const exists = loadedCustomers.some(
          c =>
            (accPhoneDigits && getPhoneDigits(c.phone) === accPhoneDigits) ||
            (accEmail && c.email?.trim().toLowerCase() === accEmail)
        );
        if (!exists && acc.name) {
          missingStaffAsCustomers.push({
            id: `cust-staff-${acc.id}`,
            name: acc.name,
            phone: formatKazakhstanPhone(acc.phone) || acc.phone,
            email: acc.email || '',
            bonusBalance: 500,
            ordersCount: 0,
            totalSpentKzt: 0,
            registeredAt: acc.createdAt ? acc.createdAt.split('T')[0] : '2026-11-07',
            status: 'active',
            notes: `Сотрудник сети (${acc.role === 'superadmin' ? 'Суперадмин' : acc.role === 'admin' ? 'Администратор' : 'Менеджер'})`,
          });
        }
      });

      if (missingStaffAsCustomers.length > 0) {
        loadedCustomers = [...missingStaffAsCustomers, ...loadedCustomers];
        localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(loadedCustomers));
      }

      setCustomers(loadedCustomers);

      const savedPromos = localStorage.getItem(STORAGE_PROMOTIONS_KEY);
      if (savedPromos) {
        setPromotions(JSON.parse(savedPromos));
      }

      const savedBranches = localStorage.getItem(STORAGE_BRANCHES_KEY);
      if (savedBranches) {
        try {
          const parsed = JSON.parse(savedBranches);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setBranches(parsed);
          }
        } catch (e) {
          console.error('Failed to parse saved branches', e);
        }
      }

      const savedIntegrations = localStorage.getItem(STORAGE_INTEGRATIONS_KEY);
      if (savedIntegrations) {
        try {
          const parsed = JSON.parse(savedIntegrations);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setIntegrations(parsed);
          }
        } catch (e) {
          console.error('Failed to parse saved integrations', e);
        }
      }
    } catch (e) {
      console.error('Error loading admin state from localStorage', e);
    } finally {
      setIsClientReady(true);
    }
  }, []);

  // Set default tab based on role and guard against unauthorized tab access
  useEffect(() => {
    if (currentAccount) {
      if (currentAccount.role === 'manager') {
        if (!['inventory', 'ai_ingest', 'promotions'].includes(activeTab)) {
          setActiveTab('inventory');
        }
      } else if (currentAccount.role === 'admin') {
        if (['users', 'settings'].includes(activeTab)) {
          setActiveTab('dashboard');
        }
      }
    }
  }, [currentAccount?.role, activeTab]);

  // Sync state changes to localStorage
  const saveAccountsToStorage = (updated: AdminAccount[]) => {
    setAccounts(updated);
    localStorage.setItem(STORAGE_ADMIN_ACCOUNTS_KEY, JSON.stringify(updated));
  };

  const saveCustomersToStorage = (updated: CustomerAccount[]) => {
    setCustomers(updated);
    localStorage.setItem(STORAGE_CUSTOMERS_KEY, JSON.stringify(updated));
  };

  const savePromosToStorage = (updated: PromoPromotion[]) => {
    setPromotions(updated);
    localStorage.setItem(STORAGE_PROMOTIONS_KEY, JSON.stringify(updated));
  };

  const saveBranchesToStorage = (updated: StoreBranch[]) => {
    setBranches(updated);
    saveStoredBranches(updated);
  };

  const saveIntegrationsToStorage = (updated: IntegrationConfig[]) => {
    setIntegrations(updated);
    saveStoredIntegrations(updated);
  };

  const handleLoginSuccess = (account: AdminAccount) => {
    setCurrentAccount(account);
    localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(account));

    // Synchronize active storefront session so the whole platform reflects this employee
    try {
      const customerSync = {
        id: `cust-staff-${account.id}`,
        phone: account.phone,
        fullName: account.name,
        name: account.name,
        email: account.email,
        role: account.role === 'manager' ? 'store_manager' : 'admin',
        bonusesKzt: 500,
        ordersCount: 0,
      };
      localStorage.setItem('indiatrikotaj_customer_user', JSON.stringify(customerSync));
      window.dispatchEvent(new Event('auth_state_changed'));
    } catch {}

    showToast(`Добро пожаловать, ${account.name}!`);
  };

  const handleSwitchAccount = (role: AdminRole) => {
    const target = accounts.find(a => a.role === role);
    if (!target) return;
    setCurrentAccount(target);
    localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(target));

    try {
      const customerSync = {
        id: `cust-staff-${target.id}`,
        phone: target.phone,
        fullName: target.name,
        name: target.name,
        email: target.email,
        role: target.role === 'manager' ? 'store_manager' : 'admin',
        bonusesKzt: 500,
        ordersCount: 0,
      };
      localStorage.setItem('indiatrikotaj_customer_user', JSON.stringify(customerSync));
      window.dispatchEvent(new Event('auth_state_changed'));
    } catch {}

    if (role === 'manager' && (activeTab === 'users' || activeTab === 'settings')) {
      setActiveTab('inventory');
    }
    showToast(`Переключен профиль: ${target.name} (${role.toUpperCase()})`);
  };

  const handleLogout = () => {
    setCurrentAccount(null);
    localStorage.removeItem(STORAGE_ADMIN_SESSION_KEY);
    try {
      localStorage.removeItem('indiatrikotaj_customer_user');
      window.dispatchEvent(new Event('auth_state_changed'));
    } catch {}
    showToast('Сеанс завершен');
  };

  const handleRegisterNewStaff = (newAcc: AdminAccount, newCust: CustomerAccount) => {
    const updatedAccounts = [...accounts, newAcc];
    saveAccountsToStorage(updatedAccounts);

    const updatedCusts = [newCust, ...customers];
    saveCustomersToStorage(updatedCusts);
    try {
      window.dispatchEvent(new Event('auth_state_changed'));
    } catch {}
    showToast(`Пользователь «${newAcc.name}» успешно зарегистрирован и добавлен в список клиентов!`);
  };

  // Fetch orders and products
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'Authorization': 'Bearer mock-admin-token' },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/admin/products', {
        headers: { 'Authorization': 'Bearer mock-admin-token' },
      });
      if (res.ok) {
        const data = await res.json();
        const apiProds: ProductItem[] = data.products || [];

        // Also merge local dynamic products so newly added/edited items immediately reflect
        const dynamicStored = getStoredDynamicProducts();
        if (dynamicStored.length > 0) {
          const convertedDynamics: ProductItem[] = dynamicStored.map(d => ({
            id: d.id,
            slug: d.slug,
            nameRu: d.nameRu,
            nameKz: d.nameKz,
            categorySlug: d.categorySlug,
            basePriceKzt: d.basePriceKzt,
            imageUrl: d.imageUrl || (Array.isArray(d.images) && d.images[0]) || '',
            images: d.images,
            compositionRu: d.materialRu || '',
            compositionKz: d.materialKz || '',
            descriptionRu: d.descriptionRu,
            descriptionKz: d.descriptionKz,
            totalStock: Object.values(d.stockByStore || {}).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0) as number,
            stockByBranch: d.stockByStore || {},
            isPublished: true,
          }));

          const dynamicIds = new Set(convertedDynamics.map(d => d.id));
          const combined = [
            ...convertedDynamics,
            ...apiProds.filter(p => !dynamicIds.has(p.id)),
          ];
          setProducts(combined);
          return;
        }

        setProducts(apiProds);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (currentAccount) {
      fetchOrders();
      fetchProducts();
    }
  }, [currentAccount]);

  // Order status update
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-admin-token',
        },
        body: JSON.stringify({ id: orderId, status: newStatus }),
      });
      if (res.ok) {
        setOrders(prev => prev.map(o => (o.id === orderId ? { ...o, status: newStatus as any } : o)));
        showToast(`Статус заказа изменен на ${newStatus}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Stock update
  const saveBranchStock = async (productId: string, updatedStockMap: Record<string, number>) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-admin-token',
        },
        body: JSON.stringify({ id: productId, updates: { stockByBranch: updatedStockMap } }),
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p =>
            p.id === productId
              ? {
                  ...p,
                  stockByBranch: updatedStockMap,
                  totalStock: Object.values(updatedStockMap).reduce((a, b) => a + b, 0),
                }
              : p
          )
        );
        showToast('Остатки успешно сохранены!');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Publish / Unpublish Product
  const togglePublish = async (productId: string, currentStatus: boolean) => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-admin-token',
        },
        body: JSON.stringify({ id: productId, updates: { isPublished: !currentStatus } }),
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, isPublished: !currentStatus } : p))
        );
        showToast(!currentStatus ? 'Товар опубликован на витрине' : 'Товар скрыт с витрины');
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete product (Superadmin, Admin, Manager)
  const handleDeleteProduct = (productId: string, name: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить товар "${name}"?`)) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      showToast(`Товар "${name}" удален из каталога`);
    }
  };

  // Customer Management (Superadmin, Admin)
  const handleToggleCustomerStatus = (custId: string) => {
    const updated = customers.map(c =>
      c.id === custId ? { ...c, status: (c.status === 'active' ? 'blocked' : 'active') as 'active' | 'blocked' } : c
    );
    saveCustomersToStorage(updated);
    showToast('Статус клиента обновлен');
  };

  const handleApplyBonusAdjustment = () => {
    if (!bonusModalCustomer) return;
    const updated = customers.map(c => {
      if (c.id === bonusModalCustomer.id) {
        const newBalance = Math.max(0, c.bonusBalance + bonusDelta);
        return { ...c, bonusBalance: newBalance };
      }
      return c;
    });
    saveCustomersToStorage(updated);
    showToast(`Баланс бонусов клиента ${bonusModalCustomer.name} скорректирован на ${bonusDelta > 0 ? `+${bonusDelta}` : bonusDelta} ₸!`);
    setBonusModalCustomer(null);
  };

  const handleOpenCreateCustomer = () => {
    if (isManager) {
      showToast('Добавление клиентов доступно Администраторам сети');
      return;
    }
    setIsCreatingCustomer(true);
    setCustomerModalData({
      id: '',
      name: '',
      phone: '+7 (',
      email: '',
      bonusBalance: 500,
      ordersCount: 0,
      totalSpentKzt: 0,
      registeredAt: new Date().toISOString().split('T')[0] || '2026-11-07',
      status: 'active',
      address: '',
      notes: '',
    });
  };

  const handleOpenEditCustomer = (cust: CustomerAccount) => {
    setIsCreatingCustomer(false);
    setCustomerModalData({
      ...cust,
      phone: formatKazakhstanPhone(cust.phone) || cust.phone,
    });
  };

  const handleDeleteCustomer = (customerId: string, customerName: string) => {
    if (isManager) {
      showToast('У менеджера нет прав на удаление профилей клиентов');
      return;
    }
    if (window.confirm(`Вы уверены, что хотите удалить профиль клиента «${customerName}» из базы?`)) {
      const updated = customers.filter(c => c.id !== customerId);
      saveCustomersToStorage(updated);
      showToast(`Клиент «${customerName}» удален из базы`);
      if (customerModalData?.id === customerId) {
        setCustomerModalData(null);
      }
    }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerModalData) return;

    // Validate and format phone number according to Kazakhstan rules
    const formattedPhone = formatKazakhstanPhone(customerModalData.phone);
    const isValidPhone =
      validateKazakhstanPhone(customerModalData.phone) ||
      validateKazakhstanPhone(formattedPhone);

    if (!isValidPhone) {
      showToast('Укажите корректный номер телефона Казахстана: +7 (7XX) XXX-XX-XX');
      return;
    }

    const cleanPhone = formattedPhone || customerModalData.phone.trim();
    const phoneDigits = getPhoneDigits(cleanPhone);

    // 1. Check duplicate phone number
    const existingByPhone = customers.find(
      c => c.id !== customerModalData.id && getPhoneDigits(c.phone) === phoneDigits
    );
    if (existingByPhone) {
      showToast(
        `Клиент с номером ${cleanPhone} уже существует в базе: «${existingByPhone.name}» (ID: ${existingByPhone.id})`
      );
      return;
    }

    // 2. Check duplicate email if email provided
    const cleanEmail = customerModalData.email.trim();
    if (cleanEmail) {
      const existingByEmail = customers.find(
        c =>
          c.id !== customerModalData.id &&
          c.email.trim().toLowerCase() === cleanEmail.toLowerCase()
      );
      if (existingByEmail) {
        showToast(
          `Клиент с email «${cleanEmail}» уже зарегистрирован: «${existingByEmail.name}»`
        );
        return;
      }
    }

    if (isCreatingCustomer) {
      const newCust: CustomerAccount = {
        ...customerModalData,
        id: `cust-${Date.now()}`,
        name: customerModalData.name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        bonusBalance: Number(customerModalData.bonusBalance) || 0,
        ordersCount: Number(customerModalData.ordersCount) || 0,
        totalSpentKzt: Number(customerModalData.totalSpentKzt) || 0,
        address: customerModalData.address?.trim() || undefined,
        notes: customerModalData.notes?.trim() || undefined,
      };
      saveCustomersToStorage([newCust, ...customers]);
      showToast(`Клиент «${newCust.name}» успешно добавлен в базу!`);
    } else {
      const updated = customers.map(c =>
        c.id === customerModalData.id
          ? {
              ...customerModalData,
              name: customerModalData.name.trim(),
              phone: cleanPhone,
              email: cleanEmail,
              bonusBalance: Number(customerModalData.bonusBalance) || 0,
              ordersCount: Number(customerModalData.ordersCount) || 0,
              totalSpentKzt: Number(customerModalData.totalSpentKzt) || 0,
              address: customerModalData.address?.trim() || undefined,
              notes: customerModalData.notes?.trim() || undefined,
            }
          : c
      );
      saveCustomersToStorage(updated);
      showToast(`Данные клиента «${customerModalData.name}» успешно обновлены!`);
    }

    setCustomerModalData(null);
  };

  // Staff Management (Superadmin ONLY)
  const handleToggleStaffActive = (staffId: string) => {
    if (staffId === currentAccount?.id) {
      showToast('Нельзя заблокировать собственный аккаунт');
      return;
    }
    const updated = accounts.map(a =>
      a.id === staffId ? { ...a, isActive: !a.isActive } : a
    );
    saveAccountsToStorage(updated);
    showToast('Статус аккаунта сотрудника изменен');
  };

  const handleChangeStaffRole = (staffId: string, newRole: AdminRole) => {
    const updated = accounts.map(a =>
      a.id === staffId ? { ...a, role: newRole } : a
    );
    saveAccountsToStorage(updated);
    showToast('Роль сотрудника обновлена');
  };

  const handleOpenCreateStaff = () => {
    setIsCreatingStaff(true);
    setStaffPasswordInput('');
    setStaffModalData({
      id: '',
      login: '',
      passwordHash: '',
      name: '',
      role: 'manager',
      email: '',
      phone: '+7 (',
      avatarBg: 'bg-emerald-600',
      createdAt: new Date().toISOString(),
      isActive: true,
    });
  };

  const handleOpenEditStaff = (acc: AdminAccount) => {
    if (!isSuperadmin && acc.role === 'superadmin') {
      showToast('Профиль Главного Владельца защищен от изменения Администратором');
      return;
    }
    setIsCreatingStaff(false);
    setStaffPasswordInput('');
    setStaffModalData({
      ...acc,
      phone: formatKazakhstanPhone(acc.phone) || acc.phone,
    });
  };

  const handleDeleteStaff = (staffId: string) => {
    if (!isSuperadmin) {
      showToast('Только Суперадмин имеет право удалять сотрудников');
      return;
    }
    if (staffId === currentAccount?.id) {
      showToast('Нельзя удалить собственный аккаунт');
      return;
    }
    const target = accounts.find(a => a.id === staffId);
    if (target?.role === 'superadmin') {
      showToast('Нельзя удалить профиль Главного Владельца');
      return;
    }
    if (window.confirm(`Вы уверены, что хотите удалить сотрудника «${target?.name || staffId}» из системы?`)) {
      const updated = accounts.filter(a => a.id !== staffId);
      saveAccountsToStorage(updated);
      showToast('Сотрудник успешно удален');
      if (staffModalData?.id === staffId) {
        setStaffModalData(null);
      }
    }
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffModalData) return;

    // 1. Full name check
    const cleanName = staffModalData.name.trim();
    if (!cleanName) {
      showToast('Укажите ФИО сотрудника');
      return;
    }

    // 2. Login check
    const cleanLogin = staffModalData.login.trim();
    if (!cleanLogin || cleanLogin.length < 3) {
      showToast('Логин сотрудника должен содержать не менее 3 символов');
      return;
    }

    // Check duplicate login
    const dupLogin = accounts.find(
      a => a.id !== staffModalData.id && a.login.trim().toLowerCase() === cleanLogin.toLowerCase()
    );
    if (dupLogin) {
      showToast(`Сотрудник с логином «${cleanLogin}» уже зарегистрирован`);
      return;
    }

    // 3. Phone validation & strict uniqueness check
    const rawPhone = staffModalData.phone ? staffModalData.phone.trim() : '';
    const phoneDigits = getPhoneDigits(rawPhone);
    if (!rawPhone || phoneDigits.length < 10) {
      showToast('Укажите полный номер телефона Казахстана: +7 (7XX) XXX-XX-XX');
      return;
    }

    const formattedStaffPhone = formatKazakhstanPhone(rawPhone);
    const isValidPhone =
      validateKazakhstanPhone(rawPhone) ||
      validateKazakhstanPhone(formattedStaffPhone);

    if (!isValidPhone) {
      showToast('Некорректный номер телефона или код оператора Казахстана: +7 (7XX) XXX-XX-XX');
      return;
    }
    const cleanPhone = formattedStaffPhone || rawPhone;

    const dupPhone = accounts.find(
      a => a.id !== staffModalData.id && getPhoneDigits(a.phone) === phoneDigits
    );
    if (dupPhone) {
      showToast(
        `Номер телефона ${cleanPhone} уже закреплен за сотрудником «${dupPhone.name}» (логин: ${dupPhone.login})`
      );
      return;
    }

    // 4. Email validation & strict uniqueness check
    const cleanEmail = staffModalData.email.trim();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      showToast('Укажите корректный адрес электронной почты (email)');
      return;
    }
    const dupEmail = accounts.find(
      a => a.id !== staffModalData.id && a.email.trim().toLowerCase() === cleanEmail.toLowerCase()
    );
    if (dupEmail) {
      showToast(
        `Email «${cleanEmail}» уже закреплен за сотрудником «${dupEmail.name}» (логин: ${dupEmail.login})`
      );
      return;
    }

    // Password check
    if (isCreatingStaff && !staffPasswordInput.trim()) {
      showToast('Задайте пароль для нового сотрудника');
      return;
    }
    const finalPassword = staffPasswordInput.trim()
      ? staffPasswordInput.trim()
      : staffModalData.passwordHash;

    const avatarBg =
      staffModalData.role === 'superadmin'
        ? 'bg-purple-600'
        : staffModalData.role === 'admin'
          ? 'bg-blue-600'
          : 'bg-emerald-600';

    if (isCreatingStaff) {
      const newAcc: AdminAccount = {
        ...staffModalData,
        id: `admin-${Date.now()}`,
        login: cleanLogin,
        passwordHash: finalPassword,
        name: staffModalData.name.trim(),
        role: staffModalData.role,
        email: cleanEmail,
        phone: cleanPhone,
        avatarBg,
        createdAt: new Date().toISOString(),
        isActive: staffModalData.isActive,
      };
      saveAccountsToStorage([...accounts, newAcc]);
      showToast(`Сотрудник «${newAcc.name}» успешно добавлен!`);
    } else {
      const updated = accounts.map(a =>
        a.id === staffModalData.id
          ? {
              ...staffModalData,
              login: cleanLogin,
              passwordHash: finalPassword,
              name: staffModalData.name.trim(),
              role: staffModalData.role,
              email: cleanEmail,
              phone: cleanPhone,
              avatarBg,
              isActive: staffModalData.isActive,
            }
          : a
      );
      saveAccountsToStorage(updated);

      // If updating the currently logged-in admin's profile, sync session!
      if (currentAccount?.id === staffModalData.id) {
        const selfUpdated = updated.find(a => a.id === currentAccount.id);
        if (selfUpdated) {
          setCurrentAccount(selfUpdated);
          localStorage.setItem(STORAGE_ADMIN_SESSION_KEY, JSON.stringify(selfUpdated));
        }
      }
      showToast(`Данные сотрудника «${staffModalData.name}» обновлены!`);
    }

    setStaffModalData(null);
  };

  // Promotion Management (Superadmin, Admin, Manager)
  const handleOpenCreatePromo = () => {
    setIsCreatingPromo(true);
    setPromoModalData({
      id: '',
      titleRu: '',
      titleKz: '',
      badgeRu: '-15%',
      discountPercent: 15,
      promoCode: '',
      categorySlug: 'all',
      validUntil: '2026-12-31',
      isActive: true,
    });
  };

  const handleOpenEditPromo = (promo: PromoPromotion) => {
    setIsCreatingPromo(false);
    setPromoModalData({ ...promo });
  };

  const handleSavePromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoModalData) return;

    if (isCreatingPromo) {
      const newP: PromoPromotion = {
        ...promoModalData,
        id: `promo-${Date.now()}`,
        titleRu: promoModalData.titleRu.trim(),
        titleKz: (promoModalData.titleKz || promoModalData.titleRu).trim(),
        badgeRu: promoModalData.badgeRu.trim(),
        promoCode: promoModalData.promoCode?.trim().toUpperCase() || undefined,
      };
      savePromosToStorage([newP, ...promotions]);
      showToast(`Акция «${newP.titleRu}» успешно создана и запущена!`);
    } else {
      const updated = promotions.map(p =>
        p.id === promoModalData.id
          ? {
              ...promoModalData,
              titleRu: promoModalData.titleRu.trim(),
              titleKz: (promoModalData.titleKz || promoModalData.titleRu).trim(),
              badgeRu: promoModalData.badgeRu.trim(),
              promoCode: promoModalData.promoCode?.trim().toUpperCase() || undefined,
            }
          : p
      );
      savePromosToStorage(updated);
      showToast(`Акция «${promoModalData.titleRu}» успешно обновлена!`);
    }

    setPromoModalData(null);
  };

  const handleDeletePromo = (promoId: string) => {
    const updated = promotions.filter(p => p.id !== promoId);
    savePromosToStorage(updated);
    showToast('Акция удалена');
  };

  const handleTogglePromoActive = (promoId: string) => {
    const updated = promotions.map(p =>
      p.id === promoId ? { ...p, isActive: !p.isActive } : p
    );
    savePromosToStorage(updated);
    showToast('Статус акции изменен');
  };

  // Branch (Stores of Almaty) Management
  const handleOpenCreateBranch = () => {
    if (isManager) {
      showToast('У менеджера нет прав на создание новых филиалов');
      return;
    }
    setIsCreatingBranch(true);
    const nextIdx = branches.length + 1;
    const padStr = String(nextIdx).padStart(3, '0');
    setBranchModalData({
      id: `store-almaty-${padStr}`,
      slug: `store-${nextIdx}`,
      nameRu: '',
      nameKz: '',
      districtRu: 'Бостандыкский район',
      districtKz: 'Бостандық ауданы',
      addressRu: '',
      addressKz: '',
      latitude: 43.2389,
      longitude: 76.8897,
      phone: '+7 (727) ',
      openHoursRu: 'Пн-Вс: 10:00 - 22:00',
      openHoursKz: 'Дс-Жс: 10:00 - 22:00',
    });
  };

  const handleOpenEditBranch = (branch: StoreBranch) => {
    setIsCreatingBranch(false);
    setBranchModalData({
      ...branch,
      phone: formatKazakhstanPhone(branch.phone) || branch.phone,
    });
  };

  const handleDeleteBranch = (branchId: string, branchName: string) => {
    if (!isSuperadmin) {
      showToast('Только Суперадмин имеет право удалять филиалы из сети');
      return;
    }
    if (branches.length <= 1) {
      showToast('В сети должен оставаться как минимум один филиал');
      return;
    }
    if (window.confirm(`Вы действительно хотите удалить магазин «${branchName}» из сети?`)) {
      const updated = branches.filter(b => b.id !== branchId);
      saveBranchesToStorage(updated);
      showToast(`Магазин «${branchName}» удален`);
      if (branchModalData?.id === branchId) {
        setBranchModalData(null);
      }
    }
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchModalData) return;

    // 1. Name validation
    const cleanNameRu = branchModalData.nameRu.trim();
    if (!cleanNameRu) {
      showToast('Укажите название магазина на русском языке');
      return;
    }
    const cleanNameKz = branchModalData.nameKz.trim() || cleanNameRu;

    // Duplicate name check
    const dupName = branches.find(
      b => b.id !== branchModalData.id && b.nameRu.trim().toLowerCase() === cleanNameRu.toLowerCase()
    );
    if (dupName) {
      showToast(`Магазин с названием «${cleanNameRu}» уже существует в списке`);
      return;
    }

    // 2. Address validation
    const cleanAddressRu = branchModalData.addressRu.trim();
    if (!cleanAddressRu) {
      showToast('Укажите точный адрес магазина');
      return;
    }
    const cleanAddressKz = branchModalData.addressKz.trim() || cleanAddressRu;

    // Duplicate address check
    const dupAddress = branches.find(
      b => b.id !== branchModalData.id && b.addressRu.trim().toLowerCase() === cleanAddressRu.toLowerCase()
    );
    if (dupAddress) {
      showToast(`Магазин по адресу «${cleanAddressRu}» уже зарегистрирован: «${dupAddress.nameRu}»`);
      return;
    }

    // 3. Phone validation & duplicate check
    const rawPhone = branchModalData.phone ? branchModalData.phone.trim() : '';
    const phoneDigits = getPhoneDigits(rawPhone);
    if (!rawPhone || phoneDigits.length < 10) {
      showToast('Укажите полный номер телефона магазина: +7 (7XX) XXX-XX-XX');
      return;
    }
    const formattedPhone = formatKazakhstanPhone(rawPhone);
    const isValidPhone = validateKazakhstanPhone(rawPhone) || validateKazakhstanPhone(formattedPhone);
    if (!isValidPhone) {
      showToast('Некорректный номер телефона магазина: +7 (7XX) XXX-XX-XX');
      return;
    }
    const cleanPhone = formattedPhone || rawPhone;

    const dupPhone = branches.find(
      b => b.id !== branchModalData.id && getPhoneDigits(b.phone) === phoneDigits
    );
    if (dupPhone) {
      showToast(`Номер телефона ${cleanPhone} уже закреплен за филиалом «${dupPhone.nameRu}»`);
      return;
    }

    // 4. Slug validation
    const rawSlug = branchModalData.slug.trim() || cleanNameRu.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const cleanSlug = rawSlug.replace(/^-+|-+$/g, '') || `store-${Date.now()}`;
    const dupSlug = branches.find(
      b => b.id !== branchModalData.id && b.slug.trim().toLowerCase() === cleanSlug.toLowerCase()
    );
    if (dupSlug) {
      showToast(`Слаг «${cleanSlug}» уже занят другим филиалом`);
      return;
    }

    const cleanDistrictRu = branchModalData.districtRu.trim() || 'Медеуский район';
    const cleanDistrictKz = branchModalData.districtKz.trim() || 'Медеу ауданы';
    const cleanHoursRu = branchModalData.openHoursRu.trim() || 'Пн-Вс: 10:00 - 22:00';
    const cleanHoursKz = branchModalData.openHoursKz.trim() || 'Дс-Жс: 10:00 - 22:00';

    if (isCreatingBranch) {
      const newBranch: StoreBranch = {
        ...branchModalData,
        id: branchModalData.id || `store-almaty-${String(Date.now()).slice(-4)}`,
        slug: cleanSlug,
        nameRu: cleanNameRu,
        nameKz: cleanNameKz,
        districtRu: cleanDistrictRu,
        districtKz: cleanDistrictKz,
        addressRu: cleanAddressRu,
        addressKz: cleanAddressKz,
        phone: cleanPhone,
        openHoursRu: cleanHoursRu,
        openHoursKz: cleanHoursKz,
        latitude: Number(branchModalData.latitude) || 43.2389,
        longitude: Number(branchModalData.longitude) || 76.8897,
      };
      saveBranchesToStorage([...branches, newBranch]);
      showToast(`Магазин «${newBranch.nameRu}» успешно добавлен в сеть!`);
    } else {
      const updated = branches.map(b =>
        b.id === branchModalData.id
          ? {
              ...branchModalData,
              slug: cleanSlug,
              nameRu: cleanNameRu,
              nameKz: cleanNameKz,
              districtRu: cleanDistrictRu,
              districtKz: cleanDistrictKz,
              addressRu: cleanAddressRu,
              addressKz: cleanAddressKz,
              phone: cleanPhone,
              openHoursRu: cleanHoursRu,
              openHoursKz: cleanHoursKz,
              latitude: Number(branchModalData.latitude) || 43.2389,
              longitude: Number(branchModalData.longitude) || 76.8897,
            }
          : b
      );
      saveBranchesToStorage(updated);
      showToast(`Карточка магазина «${cleanNameRu}» обновлена!`);
    }

    setBranchModalData(null);
  };

  // Wait until client hydration is done to check session
  if (!isClientReady) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-amber-500 font-bold">
        Загрузка панели управления...
      </div>
    );
  }

  // Auth gate check: Nobody enters without being logged in!
  if (!currentAccount) {
    return (
      <AdminAuthGate
        accounts={accounts}
        customers={customers}
        onLoginSuccess={handleLoginSuccess}
        onRegisterAccount={handleRegisterNewStaff}
      />
    );
  }

  // Role permissions:
  const isSuperadmin = currentAccount.role === 'superadmin';
  const isAdmin = currentAccount.role === 'admin';
  const isManager = currentAccount.role === 'manager';

  // Stats calculation
  const totalRevenue = orders.reduce((acc, o) => (o.status !== 'cancelled' ? acc + o.totalKzt : acc), 0);
  const pendingOrders = orders.filter(o => ['paid', 'processing', 'ready_for_pickup'].includes(o.status));
  const filteredProducts = products.filter(
    p =>
      p.nameRu.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(productSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-2 border border-emerald-400 font-medium text-sm">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="bg-slate-950/90 backdrop-blur border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>На витрину</span>
            </Link>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-amber-400 text-sm">ИНДИЙСКИЙ ТРИКОТАЖ</span>
              <span className="text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                Control Hub
              </span>
            </div>
          </div>

          {/* Current Logged-in Employee Card & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-800/90 py-1.5 px-3 rounded-2xl border border-slate-700 text-xs">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs ${currentAccount.avatarBg}`}
              >
                {currentAccount.name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <div className="font-bold text-white leading-tight">{currentAccount.name}</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                  {isSuperadmin && <span className="text-purple-400 font-bold">● Суперадмин (Полный доступ)</span>}
                  {isAdmin && <span className="text-blue-400 font-bold">● Администратор</span>}
                  {isManager && <span className="text-emerald-400 font-bold">● Контент-Менеджер (Товары & Акции)</span>}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/50 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors"
              title="Выйти из админки"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      {/* Sub Navigation Bar with Role Filtering */}
      <div className="bg-slate-950/40 border-b border-slate-800/60">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center gap-2 overflow-x-auto py-2 text-xs font-medium">
          {/* Dashboard (Superadmin & Admin) */}
          {(isSuperadmin || isAdmin) && (
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Сводка</span>
            </button>
          )}

          {/* Orders (Superadmin & Admin - контроль покупок клиентов) */}
          {(isSuperadmin || isAdmin) && (
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors relative ${
                activeTab === 'orders'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Заказы клиентов</span>
              {pendingOrders.length > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          )}

          {/* Products & Stock (All roles: Superadmin, Admin, Manager) */}
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'inventory'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Карточки товаров и Остатки</span>
          </button>

          {/* AI Product Ingest (All roles: Superadmin, Admin, Manager) */}
          <button
            onClick={() => setActiveTab('ai_ingest')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'ai_ingest'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Добавление товаров (ИИ)</span>
          </button>

          {/* Promotions & Discounts (All roles: Superadmin, Admin, Manager) */}
          <button
            onClick={() => setActiveTab('promotions')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
              activeTab === 'promotions'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-400" />
            <span>Акции и Промокоды</span>
          </button>

          {/* Customers & Bonuses (Superadmin & Admin - управление клиентами и начисление бонусов) */}
          {(isSuperadmin || isAdmin) && (
            <button
              onClick={() => setActiveTab('customers')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'customers'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              <span>Клиенты и Бонусы</span>
            </button>
          )}

          {/* Staff & Roles (Superadmin ONLY - управление админами, добавление и смена ролей) */}
          {isSuperadmin && (
            <button
              onClick={() => setActiveTab('users')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'users'
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>Сотрудники и Роли</span>
            </button>
          )}

          {/* Branches (Superadmin & Admin) */}
          {(isSuperadmin || isAdmin) && (
            <button
              onClick={() => setActiveTab('branches')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'branches'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Магазины Алматы ({branches.length})</span>
            </button>
          )}

          {/* Integrations (Superadmin ONLY) */}
          {isSuperadmin && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors ${
                activeTab === 'settings'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Шлюзы, API & Kaspi ({integrations.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Body Content */}
      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6 flex-1 w-full space-y-6">
        {/* Role Banner */}
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between text-xs gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-white">Текущий профиль:</span>
            <span className="text-amber-400 font-semibold">{currentAccount.name}</span>
            <span className="text-slate-500 hidden sm:inline">|</span>
            <span className="text-slate-400 hidden sm:inline">{currentAccount.email}</span>
            <span className="text-slate-500">|</span>
            {isSuperadmin && (
              <span className="bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                👑 Суперадмин (Полный доступ 100%)
              </span>
            )}
            {isAdmin && (
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                🛡️ Администратор (Клиенты, Заказы, Бонусы, Товары)
              </span>
            )}
            {isManager && (
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-bold">
                📋 Менеджер (Карточки товаров и Акции)
              </span>
            )}
          </div>
        </div>

        {/* 1. TAB: DASHBOARD (Superadmin & Admin) */}
        {activeTab === 'dashboard' && (isSuperadmin || isAdmin) && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Выручка сети</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2">{formatKZT(totalRevenue)}</div>
                <div className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>+18.4% по отношению к прошлому месяцу</span>
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Заказов в работе</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2">{pendingOrders.length}</div>
                <div className="text-xs text-slate-400 mt-1">
                  Самовывоз из 16 филиалов и курьер Яндекс
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Клиентская база</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2">{customers.length} чел.</div>
                <div className="text-xs text-purple-300 mt-1">
                  Активные участники бонусной программы
                </div>
              </div>

              <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Сотрудники панели</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-2">{accounts.length} сотрудн.</div>
                <div className="text-xs text-emerald-300 mt-1">
                  3 роли с разграничением доступа
                </div>
              </div>
            </div>

            {/* Quick alert box for superadmin */}
            {isSuperadmin && (
              <div className="bg-gradient-to-r from-purple-900/30 to-amber-900/30 border border-purple-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-400" />
                    Вы вошли под учетной записью Главного Владельца (Суперадмин)
                  </h4>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Вам доступны все разделы: управление персоналом, шлюзами Kaspi & ОФД, бонусами клиентов и каталогом.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('users')}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                >
                  Управление персоналом →
                </button>
              </div>
            )}

            {/* Quick alert box for admin */}
            {isAdmin && (
              <div className="bg-gradient-to-r from-blue-900/30 to-amber-900/30 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                    Вы вошли под учетной записью Администратора
                  </h4>
                  <p className="text-xs text-blue-200 mt-0.5">
                    Вам доступны: управление клиентами, контроль покупок и заказов, начисление бонусов, добавление, изменение и удаление карточек товаров.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('orders')}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all"
                >
                  Перейти к заказам →
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. TAB: ORDERS (Superadmin & Admin) */}
        {activeTab === 'orders' && (isSuperadmin || isAdmin) && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Все заказы клиентов</h3>
                <p className="text-xs text-slate-400">Контроль статусов, фискальных чеков и самовывоза</p>
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={orderFilterStatus}
                  onChange={e => setOrderFilterStatus(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg text-xs text-white px-2.5 py-1.5 focus:outline-none"
                >
                  <option value="all">Все статусы</option>
                  <option value="paid">Оплачен</option>
                  <option value="processing">В сборке</option>
                  <option value="ready_for_pickup">Готов к выдаче</option>
                  <option value="in_transit">В пути (Курьер)</option>
                  <option value="delivered">Доставлен / Выдан</option>
                  <option value="cancelled">Отменен</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs table-auto min-w-[1200px]">
                  <thead className="bg-slate-900/90 text-slate-300 uppercase font-bold tracking-wider border-b border-slate-700/60">
                    <tr>
                      <th className="py-3.5 px-3 whitespace-nowrap w-32">№ Заказа</th>
                      <th className="py-3.5 px-3 w-44">Клиент</th>
                      <th className="py-3.5 px-3 whitespace-nowrap w-24">Сумма</th>
                      <th className="py-3.5 px-3 w-56">Доставка / Филиал</th>
                      <th className="py-3.5 px-3 whitespace-nowrap w-24">Оплата</th>
                      <th className="py-3.5 px-3 min-w-[200px]">Состав заказа</th>
                      <th className="py-3.5 px-3 whitespace-nowrap w-28">Дата</th>
                      <th className="py-3.5 px-3 whitespace-nowrap w-32">Статус</th>
                      <th className="py-3.5 px-3 text-right whitespace-nowrap w-36">Управление</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {orders
                      .filter(o => orderFilterStatus === 'all' || o.status === orderFilterStatus)
                      .map(order => (
                        <tr key={order.id} className="hover:bg-slate-800/50 transition-colors">
                          <td className="py-3 px-3 font-mono font-bold text-amber-400 whitespace-nowrap">
                            {order.orderNumber}
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-white truncate max-w-[170px]" title={order.customerName}>
                              {order.customerName}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">{order.customerPhone}</div>
                          </td>
                          <td className="py-3 px-3 font-bold text-white whitespace-nowrap">
                            {formatKZT(order.totalKzt)}
                          </td>
                          <td className="py-3 px-3">
                            {order.fulfillmentType === 'pickup' ? (
                              <div className="text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded font-medium truncate max-w-[210px]" title={order.pickupStoreNameRu || 'Самовывоз'}>
                                🏬 {order.pickupStoreNameRu || 'Самовывоз'}
                              </div>
                            ) : (
                              <div className="text-blue-400 bg-blue-500/10 px-2 py-1 rounded font-medium truncate max-w-[210px]" title={order.deliveryAddress || 'Курьер Яндекс'}>
                                🚚 {order.deliveryAddress || 'Курьер Яндекс'}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {order.paymentMethod === 'kaspi_red' ? (
                              <span className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-black">
                                Kaspi Red
                              </span>
                            ) : order.paymentMethod === 'kaspi_gold' ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                Kaspi Gold
                              </span>
                            ) : (
                              <span className="bg-red-600/20 text-red-400 border border-red-600/30 px-2 py-0.5 rounded text-[10px] font-bold">
                                Kaspi QR
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <div className="line-clamp-2 text-[11px] text-slate-300 leading-tight" title={order.itemsSummaryRu}>
                              {order.itemsSummaryRu}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                            {order.createdAt ? new Date(order.createdAt).toLocaleDateString('ru-RU', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            }) : 'Недавно'}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                order.status === 'paid'
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : order.status === 'processing'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : order.status === 'ready_for_pickup'
                                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                                  : order.status === 'delivered'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                              }`}
                            >
                              {order.status === 'paid' && 'Оплачен'}
                              {order.status === 'processing' && 'В сборке'}
                              {order.status === 'ready_for_pickup' && 'Готов к выдаче'}
                              {order.status === 'delivered' && 'Выдан'}
                              {order.status === 'in_transit' && 'В пути'}
                              {order.status === 'cancelled' && 'Отменен'}
                              {order.status === 'pending' && 'Ожидает'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right whitespace-nowrap">
                            <select
                              value={order.status}
                              onChange={e => updateOrderStatus(order.id, e.target.value)}
                              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-lg px-2 py-1.5 text-[11px] font-medium focus:outline-none focus:border-amber-500"
                            >
                              <option value="paid">Оплачен</option>
                              <option value="processing">В сборке</option>
                              <option value="ready_for_pickup">Готов к выдаче</option>
                              <option value="delivered">Выдан / Доставлен</option>
                              <option value="cancelled">Отменить</option>
                            </select>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 3. TAB: INVENTORY & PRODUCTS (All: Superadmin, Admin, Manager) */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Каталог товаров и остатки по 16 филиалам</h3>
                <p className="text-xs text-slate-400">
                  {isManager
                    ? 'Права менеджера: редактирование карточек, изменение цен и остатков'
                    : 'Полный доступ к ассортименту и витрине'}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Поиск по названию или артикулу..."
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    className="bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none w-64"
                  />
                </div>

                <button
                  onClick={() => {
                    setProductToEdit(null);
                    setActiveTab('ai_ingest');
                  }}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Добавить товар через ИИ</span>
                </button>
              </div>
            </div>

            {/* Products Grid / Table */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map(p => (
                <div
                  key={p.id}
                  onClick={() => {
                    setProductToEdit(p);
                    setActiveTab('ai_ingest');
                  }}
                  className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 hover:border-amber-500/60 rounded-2xl p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl group"
                >
                  <div className="flex gap-3">
                    <div className="relative w-16 h-16 shrink-0">
                      <img
                        src={p.imageUrl}
                        alt={p.nameRu}
                        className="w-16 h-16 rounded-xl object-cover bg-slate-900 border border-slate-700 group-hover:border-amber-500/50 transition-colors"
                      />
                      {Array.isArray((p as any).images) && (p as any).images.length > 1 && (
                        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[9px] px-1 rounded shadow">
                          {(p as any).images.length} фото
                        </span>
                      )}
                    </div>
                    <div className="space-y-1 overflow-hidden flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-amber-400 uppercase font-mono font-bold tracking-wider">
                          {p.categorySlug}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                            p.isPublished ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                          }`}
                        >
                          {p.isPublished ? 'На витрине' : 'Скрыт'}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-xs truncate group-hover:text-amber-300 transition-colors" title={p.nameRu}>
                        {p.nameRu}
                      </h4>
                      <p className="text-[11px] text-slate-400 truncate">{p.compositionRu}</p>
                      <div className="font-bold text-amber-400 text-sm">{formatKZT(p.basePriceKzt)}</div>
                    </div>
                  </div>

                  <div
                    onClick={e => e.stopPropagation()}
                    className="bg-slate-900/60 rounded-xl p-2.5 text-xs flex items-center justify-between"
                  >
                    <div>
                      <span className="text-slate-400">Всего в сети: </span>
                      <span className="font-bold text-white">{p.totalStock} шт.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingStockProduct(p)}
                      className="text-amber-400 hover:text-amber-300 font-semibold underline text-[11px]"
                    >
                      Остатки по 16 филиалам
                    </button>
                  </div>

                  <div
                    onClick={e => e.stopPropagation()}
                    className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setProductToEdit(p);
                        setActiveTab('ai_ingest');
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg transition-colors border border-amber-500/20"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Изменить карточку</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => togglePublish(p.id, p.isPublished)}
                        className="text-[11px] font-semibold text-slate-400 hover:text-white"
                      >
                        {p.isPublished ? 'Снять' : 'Опубликовать'}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id, p.nameRu)}
                        className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Удалить товар"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal: Edit Branch Stocks */}
            {editingStockProduct && (
              <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base">Остатки по {branches.length} магазинам г. Алматы</h3>
                      <p className="text-xs text-amber-400">{editingStockProduct.nameRu}</p>
                    </div>
                    <button
                      onClick={() => setEditingStockProduct(null)}
                      className="text-slate-400 hover:text-white text-sm"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="overflow-y-auto space-y-2 flex-1 pr-1">
                    {branches.map(b => {
                      const currentCount = editingStockProduct.stockByBranch[b.id] ?? 0;
                      return (
                        <div
                          key={b.id}
                          className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/40 text-xs"
                        >
                          <div>
                            <div className="font-semibold text-white">{b.nameRu}</div>
                            <div className="text-[10px] text-slate-400">{b.addressRu}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                const newMap = {
                                  ...editingStockProduct.stockByBranch,
                                  [b.id]: Math.max(0, currentCount - 1),
                                };
                                setEditingStockProduct({ ...editingStockProduct, stockByBranch: newMap });
                              }}
                              className="w-7 h-7 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 flex items-center justify-center"
                            >
                              -
                            </button>
                            <span className="w-8 text-center font-bold text-amber-400">{currentCount}</span>
                            <button
                              onClick={() => {
                                const newMap = {
                                  ...editingStockProduct.stockByBranch,
                                  [b.id]: currentCount + 1,
                                };
                                setEditingStockProduct({ ...editingStockProduct, stockByBranch: newMap });
                              }}
                              className="w-7 h-7 rounded-lg bg-slate-700 text-white font-bold hover:bg-slate-600 flex items-center justify-center"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                    <button
                      onClick={() => setEditingStockProduct(null)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                    >
                      Отмена
                    </button>
                    <button
                      onClick={() => {
                        saveBranchStock(editingStockProduct.id, editingStockProduct.stockByBranch);
                        setEditingStockProduct(null);
                      }}
                      className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-2 rounded-xl text-xs font-bold"
                    >
                      Сохранить изменения
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. TAB: AI INGEST (All: Superadmin, Admin, Manager) */}
        {activeTab === 'ai_ingest' && (
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white">ИИ-распознавание товаров (Фото-сканер)</h3>
              <p className="text-xs text-slate-400">
                Загрузите фото ткани или бирки. Gemini 1.5 Vision мгновенно определит состав, категорию и создаст
                карточку на двух языках (RU / KZ).
              </p>
            </div>
            <AiProductIngest
              productToEdit={productToEdit}
              onCancel={() => {
                setProductToEdit(null);
                setActiveTab('inventory');
              }}
              onProductCreated={(savedProd) => {
                if (savedProd) {
                  setProducts(prev => {
                    const exists = prev.some(p => p.id === savedProd.id);
                    if (exists) {
                      return prev.map(p => (p.id === savedProd.id ? { ...p, ...savedProd } : p));
                    }
                    return [savedProd, ...prev];
                  });
                } else {
                  fetchProducts();
                }
                const wasEditing = !!productToEdit;
                setProductToEdit(null);
                setActiveTab('inventory');
                showToast(
                  wasEditing
                    ? `Изменения товара «${savedProd?.nameRu || ''}» успешно сохранены!`
                    : 'Новый товар успешно добавлен в каталог и отправлен в 16 магазинов!'
                );
              }}
            />
          </div>
        )}

        {/* 5. TAB: PROMOTIONS & DISCOUNTS (Superadmin, Admin, Manager) */}
        {activeTab === 'promotions' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Акции, скидки и промокоды на витрине</h3>
                <p className="text-xs text-slate-400">
                  Менеджер, Админ и Суперадмин могут добавлять, редактировать и отключать рекламные баннеры и скидки.
                </p>
              </div>

              <button
                onClick={handleOpenCreatePromo}
                className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Создать новую акцию</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {promotions.map(promo => (
                <div
                  key={promo.id}
                  onClick={() => handleOpenEditPromo(promo)}
                  className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/60 hover:border-amber-500/60 rounded-2xl p-4 flex flex-col justify-between space-y-3 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xl group"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="bg-amber-500/20 text-amber-300 font-black text-xs px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                        {promo.badgeRu}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTogglePromoActive(promo.id);
                        }}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors ${
                          promo.isActive ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30' : 'bg-neutral-700 text-neutral-400 hover:bg-neutral-600'
                        }`}
                      >
                        {promo.isActive ? 'Активна на сайте' : 'Приостановлена'}
                      </button>
                    </div>

                    <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">{promo.titleRu}</h4>

                    {promo.promoCode && (
                      <div className="bg-slate-900/80 p-2 rounded-xl text-xs flex items-center justify-between">
                        <span className="text-slate-400">Промокод:</span>
                        <span className="font-mono font-bold text-amber-400 tracking-wider">{promo.promoCode}</span>
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Скидка: {promo.discountPercent}%</span>
                      <span>Действует до: {promo.validUntil}</span>
                    </div>
                  </div>

                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs"
                  >
                    <button
                      type="button"
                      onClick={() => handleOpenEditPromo(promo)}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg transition-colors border border-amber-500/20"
                    >
                      <Edit className="w-3 h-3" />
                      <span>Изменить акцию</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeletePromo(promo.id)}
                      className="text-red-400 hover:text-red-300 p-1 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Удалить акцию"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Unified Modal: Create / Edit Promotion */}
            {promoModalData && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Tag className="w-4 h-4 text-amber-400" />
                      <h3 className="font-bold text-white text-sm">
                        {isCreatingPromo ? 'Новая рекламная акция на витрине' : 'Редактирование акции'}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPromoModalData(null)}
                      className="text-slate-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSavePromo} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Заголовок акции (RU)</label>
                      <input
                        type="text"
                        required
                        value={promoModalData.titleRu}
                        onChange={e => setPromoModalData({ ...promoModalData, titleRu: e.target.value })}
                        placeholder="Например: Скидка 20% на хлопковые пижамы"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Тақырыбы (KZ)</label>
                      <input
                        type="text"
                        value={promoModalData.titleKz || ''}
                        onChange={e => setPromoModalData({ ...promoModalData, titleKz: e.target.value })}
                        placeholder="Мысалы: Мақта пижамаларына 20% жеңілдік"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Бейдж / Стикер</label>
                        <input
                          type="text"
                          required
                          value={promoModalData.badgeRu}
                          onChange={e => setPromoModalData({ ...promoModalData, badgeRu: e.target.value })}
                          placeholder="-20% или Kaspi 0-0-12"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Скидка (%)</label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          required
                          value={promoModalData.discountPercent}
                          onChange={e => setPromoModalData({ ...promoModalData, discountPercent: Number(e.target.value) })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Промокод (необязательно)</label>
                      <input
                        type="text"
                        value={promoModalData.promoCode || ''}
                        onChange={e => setPromoModalData({ ...promoModalData, promoCode: e.target.value.toUpperCase() })}
                        placeholder="Оставьте пустым, если скидка автоматическая"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Категория</label>
                        <select
                          value={promoModalData.categorySlug}
                          onChange={e => setPromoModalData({ ...promoModalData, categorySlug: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="all">Весь каталог</option>
                          <option value="tunics">Туники и платья</option>
                          <option value="pajamas">Пижамы</option>
                          <option value="robes">Халаты</option>
                          <option value="thermal-underwear">Термобелье</option>
                          <option value="suits">Костюмы</option>
                          <option value="kids">Детская одежда</option>
                          <option value="t-shirts">Футболки</option>
                          <option value="underwear">Нижнее белье</option>
                          <option value="textiles">Домашний текстиль</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">Действует до</label>
                        <input
                          type="date"
                          value={promoModalData.validUntil || '2026-12-31'}
                          onChange={e => setPromoModalData({ ...promoModalData, validUntil: e.target.value })}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="promo-active-toggle"
                        checked={promoModalData.isActive}
                        onChange={e => setPromoModalData({ ...promoModalData, isActive: e.target.checked })}
                        className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                      />
                      <label htmlFor="promo-active-toggle" className="text-slate-300 text-xs font-semibold cursor-pointer">
                        Акция активна и отображается на витрине
                      </label>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setPromoModalData(null)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                      >
                        Отмена
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-md"
                      >
                        {isCreatingPromo ? 'Опубликовать акцию' : 'Сохранить изменения'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 6. TAB: CUSTOMERS & BONUSES (Superadmin & Admin) */}
        {activeTab === 'customers' && (isSuperadmin || isAdmin) && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white">Управление клиентами и бонусами</h3>
                <p className="text-xs text-slate-400">
                  Просмотр и редактирование данных клиентов, баланса бонусов, истории покупок и статуса
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-xl font-semibold">
                  Курс: 1 бонус = 1 ₸
                </div>

                {(isSuperadmin || isAdmin) ? (
                  <button
                    type="button"
                    onClick={handleOpenCreateCustomer}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ Добавить клиента</span>
                  </button>
                ) : (
                  <div className="text-[11px] text-slate-400 bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl font-medium">
                    Режим поиска и просмотра (Менеджер)
                  </div>
                )}
              </div>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-700/60">
                    <tr>
                      <th className="py-3 px-4">Клиент</th>
                      <th className="py-3 px-4">Контакты</th>
                      <th className="py-3 px-4">Бонусный баланс</th>
                      <th className="py-3 px-4">Заказов / Потрачено</th>
                      <th className="py-3 px-4">Статус</th>
                      <th className="py-3 px-4 text-right">Управление</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {customers.map(cust => (
                      <tr
                        key={cust.id}
                        onClick={() => handleOpenEditCustomer(cust)}
                        className="hover:bg-slate-800/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4 font-bold text-white group-hover:text-amber-300 transition-colors">
                          <div className="flex items-center gap-2">
                            <span>{cust.name}</span>
                            <span className="opacity-0 group-hover:opacity-100 text-[10px] text-amber-400 transition-opacity flex items-center gap-0.5">
                              <Edit className="w-3 h-3" />
                              Изменить
                            </span>
                          </div>
                          {cust.address && (
                            <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs mt-0.5">
                              {cust.address}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-mono text-amber-400">
                              {formatKazakhstanPhone(cust.phone) || cust.phone}
                            </span>
                            {(duplicatePhoneMap[getPhoneDigits(cust.phone)] || 0) > 1 && (
                              <span
                                className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-1.5 py-0.2 rounded font-bold"
                                title="Внимание: в базе обнаружен дубликат с таким номером!"
                              >
                                Дубликат
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-400">{cust.email}</div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-extrabold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-xs">
                            <Coins className="w-3.5 h-3.5" />
                            {cust.bonusBalance} ₸
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div>{cust.ordersCount} заказов</div>
                          <div className="text-[11px] text-emerald-400 font-semibold">
                            {formatKZT(cust.totalSpentKzt)}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              cust.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {cust.status === 'active' ? 'Активен' : 'Заблокирован'}
                          </span>
                        </td>
                        <td
                          onClick={e => e.stopPropagation()}
                          className="py-3 px-4 text-right space-x-2"
                        >
                          <button
                            type="button"
                            onClick={() => handleOpenEditCustomer(cust)}
                            className="bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 border border-slate-700 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                            title={isManager ? 'Просмотр профиля клиента' : 'Редактировать профиль клиента'}
                          >
                            <Edit className="w-3 h-3" />
                            <span>{isManager ? 'Просмотр' : 'Изменить'}</span>
                          </button>

                          {(isSuperadmin || isAdmin) && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setBonusModalCustomer(cust);
                                  setBonusDelta(500);
                                }}
                                className="bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors"
                              >
                                ± Бонусы
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleCustomerStatus(cust.id)}
                                className={`p-1.5 rounded-lg border transition-colors ${
                                  cust.status === 'active'
                                    ? 'border-red-800/60 text-red-400 hover:bg-red-950/40'
                                    : 'border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/40'
                                }`}
                                title={cust.status === 'active' ? 'Заблокировать' : 'Разблокировать'}
                              >
                                {cust.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCustomer(cust.id, cust.name)}
                                className="p-1.5 rounded-lg border border-red-800/40 text-red-400 hover:text-red-300 hover:bg-red-950/40 transition-colors"
                                title="Удалить клиента из базы"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Bonus Adjustment */}
            {bonusModalCustomer && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <h3 className="font-bold text-white text-sm">Корректировка бонусов клиента</h3>
                    <button onClick={() => setBonusModalCustomer(null)} className="text-slate-400 hover:text-white">
                      ✕
                    </button>
                  </div>

                  <div className="bg-slate-800/60 p-3 rounded-xl text-xs space-y-1">
                    <div className="font-bold text-white">{bonusModalCustomer.name}</div>
                    <div className="text-slate-400">{bonusModalCustomer.phone}</div>
                    <div className="text-amber-400 font-bold">
                      Текущий остаток: {bonusModalCustomer.bonusBalance} бонусов
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Количество бонусов (положительное — начислить, отрицательное — списать)
                      </label>
                      <input
                        type="number"
                        value={bonusDelta}
                        onChange={e => setBonusDelta(Number(e.target.value))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono font-bold focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Причина корректировки</label>
                      <input
                        type="text"
                        value={bonusReason}
                        onChange={e => setBonusReason(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                      />
                    </div>

                    <div className="p-2.5 bg-blue-950/40 border border-blue-800/60 rounded-xl text-[11px] text-blue-300">
                      После подтверждения новый баланс составит:{' '}
                      <span className="font-black text-white">
                        {Math.max(0, bonusModalCustomer.bonusBalance + bonusDelta)} бонусов
                      </span>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setBonusModalCustomer(null)}
                        className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                      >
                        Отмена
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyBonusAdjustment}
                        className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl font-bold"
                      >
                        Применить начисление
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal: Edit or Create Customer */}
            {customerModalData && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-400" />
                        {isCreatingCustomer ? 'Новый клиент' : 'Редактирование данных клиента'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isCreatingCustomer
                          ? 'Создание профиля покупателя в базе CRM'
                          : `ID: ${customerModalData.id} • Регистрация: ${customerModalData.registeredAt}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCustomerModalData(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveCustomer} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        ФИО клиента <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Алихан Ибрагимов"
                        value={customerModalData.name}
                        onChange={e => setCustomerModalData({ ...customerModalData, name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Телефон <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="+7 (777) 123-45-67"
                          value={customerModalData.phone}
                          onChange={e =>
                            setCustomerModalData({
                              ...customerModalData,
                              phone: formatPhoneInput(e.target.value),
                            })
                          }
                          onBlur={() => {
                            if (customerModalData.phone) {
                              const fmt = formatKazakhstanPhone(customerModalData.phone);
                              if (fmt) {
                                setCustomerModalData(prev =>
                                  prev ? { ...prev, phone: fmt } : null
                                );
                              }
                            }
                          }}
                          className={`w-full bg-slate-800 border rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none transition-colors ${
                            duplicatePhoneCustomer
                              ? 'border-red-500 focus:border-red-500 text-red-200 bg-red-950/20'
                              : customerModalData.phone.length > 5
                                ? validateKazakhstanPhone(customerModalData.phone) ||
                                  validateKazakhstanPhone(formatKazakhstanPhone(customerModalData.phone))
                                  ? 'border-emerald-500/70 focus:border-emerald-500'
                                  : 'border-amber-500/70 focus:border-amber-500'
                                : 'border-slate-700 focus:border-amber-500'
                          }`}
                        />
                        {customerModalData.phone.length > 5 && (
                          <div className="mt-1 text-[11px]">
                            {duplicatePhoneCustomer ? (
                              <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 flex items-start gap-1.5 mt-1">
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-bold text-red-200">Номер уже занят в базе!</div>
                                  <div>
                                    Клиент: <span className="font-semibold text-white">{duplicatePhoneCustomer.name}</span>
                                  </div>
                                </div>
                              </div>
                            ) : validateKazakhstanPhone(customerModalData.phone) ||
                              validateKazakhstanPhone(formatKazakhstanPhone(customerModalData.phone)) ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Корректный номер (+7 7XX XXX-XX-XX)
                              </span>
                            ) : (
                              <span className="text-amber-400/90 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Формат: +7 (7XX) XXX-XX-XX
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="client@mail.kz"
                          value={customerModalData.email}
                          onChange={e => setCustomerModalData({ ...customerModalData, email: e.target.value })}
                          className={`w-full bg-slate-800 border rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-colors ${
                            duplicateEmailCustomer
                              ? 'border-red-500 focus:border-red-500 bg-red-950/20'
                              : 'border-slate-700 focus:border-amber-500'
                          }`}
                        />
                        {duplicateEmailCustomer && (
                          <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 flex items-start gap-1.5 mt-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              Email уже принадлежит: <span className="font-semibold text-white">{duplicateEmailCustomer.name}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Бонусный баланс (₸)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={customerModalData.bonusBalance}
                          onChange={e =>
                            setCustomerModalData({ ...customerModalData, bonusBalance: Number(e.target.value) })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Количество заказов
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={customerModalData.ordersCount}
                          onChange={e =>
                            setCustomerModalData({ ...customerModalData, ordersCount: Number(e.target.value) })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Потрачено всего (₸)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={customerModalData.totalSpentKzt}
                          onChange={e =>
                            setCustomerModalData({ ...customerModalData, totalSpentKzt: Number(e.target.value) })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Статус аккаунта
                        </label>
                        <select
                          value={customerModalData.status}
                          onChange={e =>
                            setCustomerModalData({
                              ...customerModalData,
                              status: e.target.value as 'active' | 'blocked',
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="active">Активен (доступ разрешен)</option>
                          <option value="blocked">Заблокирован</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Дата регистрации
                        </label>
                        <input
                          type="date"
                          value={customerModalData.registeredAt}
                          onChange={e =>
                            setCustomerModalData({ ...customerModalData, registeredAt: e.target.value })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Адрес доставки по умолчанию
                      </label>
                      <input
                        type="text"
                        placeholder="г. Алматы, ул. Достык 12, кв. 34"
                        value={customerModalData.address || ''}
                        onChange={e =>
                          setCustomerModalData({ ...customerModalData, address: e.target.value })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Заметки / CRM комментарий администратора
                      </label>
                      <textarea
                        rows={2}
                        placeholder="Предпочтения по размерам, постоянный клиент филиала..."
                        value={customerModalData.notes || ''}
                        onChange={e =>
                          setCustomerModalData({ ...customerModalData, notes: e.target.value })
                        }
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                      />
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        {!isCreatingCustomer && (isSuperadmin || isAdmin) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteCustomer(customerModalData.id, customerModalData.name)
                            }
                            className="px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Удалить профиль</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomerModalData(null)}
                          className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                        >
                          {isManager ? 'Закрыть' : 'Отмена'}
                        </button>
                        {!isManager && (
                          <button
                            type="submit"
                            disabled={Boolean(duplicatePhoneCustomer || duplicateEmailCustomer)}
                            className={`px-5 py-2 rounded-xl font-bold transition-all shadow-md ${
                              duplicatePhoneCustomer || duplicateEmailCustomer
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                          >
                            {isCreatingCustomer ? 'Добавить клиента' : 'Сохранить изменения'}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 7. TAB: USERS & ROLES (Superadmin ONLY) */}
        {activeTab === 'users' && isSuperadmin && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-purple-400" />
                  {isSuperadmin
                    ? 'Управление персоналом и ролями (Владелец сети)'
                    : 'Команда и сотрудники филиалов (Старший Администратор)'}
                </h3>
                <p className="text-xs text-slate-400">
                  {isSuperadmin
                    ? 'Добавление сотрудников, назначение и смена ролей (Суперадмин / Админ / Менеджер), блокировка доступа.'
                    : 'Просмотр контактов сотрудников, добавление и курирование контент-менеджеров филиалов.'}
                </p>
              </div>

              <button
                onClick={handleOpenCreateStaff}
                className="bg-purple-600 hover:bg-purple-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Добавить сотрудника</span>
              </button>
            </div>

            <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 uppercase font-semibold border-b border-slate-700/60">
                    <tr>
                      <th className="py-3 px-4">Сотрудник</th>
                      <th className="py-3 px-4">Логин / Email</th>
                      <th className="py-3 px-4">Роль в системе</th>
                      <th className="py-3 px-4">Статус</th>
                      <th className="py-3 px-4 text-right">Управление</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {accounts.map(acc => (
                      <tr
                        key={acc.id}
                        onClick={() => handleOpenEditStaff(acc)}
                        className="hover:bg-slate-800/70 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs ${acc.avatarBg}`}
                            >
                              {acc.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-white group-hover:text-amber-300 transition-colors">
                                  {acc.name}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-purple-400 transition-opacity flex items-center gap-0.5">
                                  <Edit className="w-3 h-3" />
                                  Изменить
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[11px] text-slate-400 font-mono">{acc.phone}</span>
                                {(duplicateStaffPhoneMap[getPhoneDigits(acc.phone)] || 0) > 1 && (
                                  <span
                                    className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-1 py-0.2 rounded font-bold"
                                    title="Внимание: обнаружен дубликат номера телефона!"
                                  >
                                    Дубликат номера
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-mono text-amber-400">{acc.login}</div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[11px] text-slate-400">{acc.email}</span>
                            {(duplicateStaffEmailMap[acc.email.trim().toLowerCase()] || 0) > 1 && (
                              <span
                                className="text-[10px] bg-red-500/20 text-red-300 border border-red-500/40 px-1 py-0.2 rounded font-bold"
                                title="Внимание: обнаружен дубликат email!"
                              >
                                Дубликат email
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4" onClick={e => e.stopPropagation()}>
                          <span
                            className={`px-2 py-0.5 rounded-lg text-xs font-bold border ${
                              acc.role === 'superadmin'
                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                                : acc.role === 'admin'
                                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            }`}
                          >
                            {acc.role === 'superadmin'
                              ? 'Суперадмин (Полный)'
                              : acc.role === 'admin'
                                ? 'Администратор (Клиенты & Каталог)'
                                : 'Менеджер (Товары & Акции)'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              acc.isActive ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'
                            }`}
                          >
                            {acc.isActive ? 'Активен' : 'Отключен'}
                          </span>
                        </td>
                        <td
                          onClick={e => e.stopPropagation()}
                          className="py-3 px-4 text-right space-x-2"
                        >
                          {acc.role === 'superadmin' && !isSuperadmin ? (
                            <span className="text-[11px] text-slate-500 italic inline-flex items-center gap-1 font-medium">
                              <Lock className="w-3 h-3 text-purple-400" /> Главный Владелец
                            </span>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleOpenEditStaff(acc)}
                                className="bg-slate-800 hover:bg-slate-700 text-purple-300 hover:text-purple-200 border border-slate-700 px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors inline-flex items-center gap-1"
                                title="Редактировать профиль сотрудника"
                              >
                                <Edit className="w-3 h-3" />
                                <span>Изменить</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleToggleStaffActive(acc.id)}
                                disabled={acc.id === currentAccount.id || acc.role === 'superadmin'}
                                className="px-2.5 py-1 rounded-lg border border-slate-700 text-slate-300 hover:text-white text-[11px] disabled:opacity-40"
                              >
                                {acc.isActive ? 'Отключить' : 'Активировать'}
                              </button>

                              {isSuperadmin && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteStaff(acc.id)}
                                  disabled={acc.id === currentAccount.id}
                                  className="text-red-400 hover:text-red-300 p-1 disabled:opacity-40 rounded-lg hover:bg-red-500/10 transition-colors"
                                  title="Удалить сотрудника"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal: Add / Edit Staff */}
            {staffModalData && (
              <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-purple-400" />
                        {isCreatingStaff ? 'Добавить нового сотрудника' : 'Редактирование профиля сотрудника'}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isCreatingStaff
                          ? 'Создание учетной записи с доступом в панель управления'
                          : `ID: ${staffModalData.id} • ${staffModalData.role.toUpperCase()}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setStaffModalData(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveStaff} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        ФИО сотрудника <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Айбек Жумабаев"
                        value={staffModalData.name}
                        onChange={e => setStaffModalData({ ...staffModalData, name: e.target.value })}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Логин в системе <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="aibek"
                          value={staffModalData.login}
                          onChange={e => setStaffModalData({ ...staffModalData, login: e.target.value })}
                          className={`w-full bg-slate-800 border rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none transition-colors ${
                            duplicateStaffLogin
                              ? 'border-red-500 focus:border-red-500 bg-red-950/20'
                              : 'border-slate-700 focus:border-purple-500'
                          }`}
                        />
                        {duplicateStaffLogin && (
                          <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 flex items-start gap-1.5 mt-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-red-200">Логин уже занят!</div>
                              <div>Сотрудник: <span className="font-semibold text-white">{duplicateStaffLogin.name}</span></div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          {isCreatingStaff ? (
                            <>
                              Пароль <span className="text-red-400">*</span>
                            </>
                          ) : (
                            'Новый пароль'
                          )}
                        </label>
                        <input
                          type="password"
                          required={isCreatingStaff}
                          placeholder={isCreatingStaff ? '••••••••' : 'Оставьте пустым, чтобы не менять'}
                          value={staffPasswordInput}
                          onChange={e => setStaffPasswordInput(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Телефон <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="+7 (701) 123-45-67"
                          value={staffModalData.phone}
                          onChange={e =>
                            setStaffModalData({
                              ...staffModalData,
                              phone: formatPhoneInput(e.target.value),
                            })
                          }
                          onBlur={() => {
                            if (staffModalData.phone) {
                              const fmt = formatKazakhstanPhone(staffModalData.phone);
                              if (fmt) {
                                setStaffModalData(prev =>
                                  prev ? { ...prev, phone: fmt } : null
                                );
                              }
                            }
                          }}
                          className={`w-full bg-slate-800 border rounded-xl px-3 py-2 text-white font-mono placeholder-slate-500 focus:outline-none transition-colors ${
                            duplicateStaffPhone
                              ? 'border-red-500 focus:border-red-500 text-red-200 bg-red-950/20'
                              : staffModalData.phone.length > 5
                                ? validateKazakhstanPhone(staffModalData.phone) ||
                                  validateKazakhstanPhone(formatKazakhstanPhone(staffModalData.phone))
                                  ? 'border-emerald-500/70 focus:border-emerald-500'
                                  : 'border-amber-500/70 focus:border-amber-500'
                                : 'border-slate-700 focus:border-purple-500'
                          }`}
                        />
                        {staffModalData.phone.length > 5 && (
                          <div className="mt-1 text-[11px]">
                            {duplicateStaffPhone ? (
                              <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 flex items-start gap-1.5 mt-1 text-[11px]">
                                <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                  <div className="font-bold text-red-200">Номер уже занят в системе!</div>
                                  <div>Сотрудник: <span className="font-semibold text-white">{duplicateStaffPhone.name}</span> (логин: {duplicateStaffPhone.login})</div>
                                </div>
                              </div>
                            ) : validateKazakhstanPhone(staffModalData.phone) ||
                              validateKazakhstanPhone(formatKazakhstanPhone(staffModalData.phone)) ? (
                              <span className="text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Корректный номер (+7 7XX XXX-XX-XX)
                              </span>
                            ) : (
                              <span className="text-amber-400/90 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Формат: +7 (7XX) XXX-XX-XX
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Email <span className="text-red-400">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          placeholder="staff@indiatrikotaj.kz"
                          value={staffModalData.email}
                          onChange={e => setStaffModalData({ ...staffModalData, email: e.target.value })}
                          className={`w-full bg-slate-800 border rounded-xl px-3 py-2 text-white placeholder-slate-500 focus:outline-none transition-colors ${
                            duplicateStaffEmail
                              ? 'border-red-500 focus:border-red-500 bg-red-950/20'
                              : 'border-slate-700 focus:border-purple-500'
                          }`}
                        />
                        {duplicateStaffEmail && (
                          <div className="p-2 rounded-lg bg-red-950/60 border border-red-800/60 text-red-300 flex items-start gap-1.5 mt-1 text-[11px]">
                            <AlertCircle className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                            <div>
                              <div className="font-bold text-red-200">Email уже занят в системе!</div>
                              <div>Сотрудник: <span className="font-semibold text-white">{duplicateStaffEmail.name}</span> (логин: {duplicateStaffEmail.login})</div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Назначаемая роль <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={staffModalData.role}
                          disabled={staffModalData.id === currentAccount.id || (!isSuperadmin && staffModalData.role === 'superadmin')}
                          onChange={e =>
                            setStaffModalData({
                              ...staffModalData,
                              role: e.target.value as AdminRole,
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                        >
                          <option value="manager">Менеджер (Товары & Акции)</option>
                          <option value="admin">Администратор (Клиенты, Бонусы, Каталог)</option>
                          {isSuperadmin && (
                            <option value="superadmin">Суперадмин (Полный доступ к системе)</option>
                          )}
                        </select>
                        {staffModalData.id === currentAccount.id && (
                          <p className="text-[10px] text-slate-400 mt-1">Нельзя изменить собственную роль</p>
                        )}
                        {!isSuperadmin && (
                          <p className="text-[10px] text-purple-300 mt-1">Назначение роли Суперадмина доступно только Владельцу</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Статус аккаунта <span className="text-red-400">*</span>
                        </label>
                        <select
                          value={staffModalData.isActive ? 'active' : 'disabled'}
                          disabled={staffModalData.id === currentAccount.id || (!isSuperadmin && staffModalData.role === 'superadmin')}
                          onChange={e =>
                            setStaffModalData({
                              ...staffModalData,
                              isActive: e.target.value === 'active',
                            })
                          }
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-purple-500 disabled:opacity-50"
                        >
                          <option value="active">Активен (доступ разрешен)</option>
                          <option value="disabled">Отключен (вход заблокирован)</option>
                        </select>
                        {staffModalData.id === currentAccount.id && (
                          <p className="text-[10px] text-slate-400 mt-1">Нельзя заблокировать собственный аккаунт</p>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                      <div>
                        {!isCreatingStaff && isSuperadmin && staffModalData.id !== currentAccount.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStaff(staffModalData.id)}
                            className="px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Удалить сотрудника</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setStaffModalData(null)}
                          className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                        >
                          Отмена
                        </button>
                        <button
                          type="submit"
                          disabled={Boolean(duplicateStaffLogin || duplicateStaffPhone || duplicateStaffEmail)}
                          className={`px-5 py-2 rounded-xl font-bold transition-all shadow-md ${
                            duplicateStaffLogin || duplicateStaffPhone || duplicateStaffEmail
                              ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                              : 'bg-purple-600 hover:bg-purple-700 text-white'
                          }`}
                        >
                          {isCreatingStaff ? 'Добавить сотрудника' : 'Сохранить изменения'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. TAB: BRANCHES (Superadmin & Admin) */}
        {activeTab === 'branches' && (isSuperadmin || isAdmin) && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  Сеть магазинов г. Алматы ({branches.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Все точки подключены к единой базе остатков, самовывозу и Kaspi Доставке
                </p>
              </div>
              {(isSuperadmin || isAdmin) && (
                <button
                  onClick={handleOpenCreateBranch}
                  className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md self-start sm:self-auto cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Добавить магазин</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {branches.map((b, idx) => {
                const isDupName = (duplicateBranchNameMap[b.nameRu.trim().toLowerCase()] || 0) > 1;
                const isDupAddr = (duplicateBranchAddressMap[b.addressRu.trim().toLowerCase()] || 0) > 1;
                const phoneDig = getPhoneDigits(b.phone);
                const isDupPhone = phoneDig.length === 10 && (duplicateBranchPhoneMap[phoneDig] || 0) > 1;
                const hasAnyDup = isDupName || isDupAddr || isDupPhone;

                return (
                  <div
                    key={b.id}
                    onClick={() => handleOpenEditBranch(b)}
                    className={`border rounded-2xl p-4 space-y-3 transition-all cursor-pointer relative group flex flex-col justify-between ${
                      hasAnyDup
                        ? 'bg-red-950/20 border-red-500/50 hover:border-red-400'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-amber-500/50 hover:bg-slate-800/70'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                          Филиал #{idx + 1}
                        </span>
                        {hasAnyDup ? (
                          <span className="text-[10px] font-bold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Дубликат
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Онлайн (1С/Kaspi)
                          </span>
                        )}
                      </div>

                      {hasAnyDup && (
                        <div className="bg-red-950/50 border border-red-800/60 rounded-lg p-2 text-[10px] text-red-300 space-y-0.5">
                          {isDupName && <div>⚠️ Дубликат названия филиала</div>}
                          {isDupAddr && <div>⚠️ Совпадает адрес с другим филиалом</div>}
                          {isDupPhone && <div>⚠️ Повторяется номер телефона</div>}
                        </div>
                      )}

                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                          {b.nameRu}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">/{b.slug}</span>
                      </div>

                      <div className="text-xs text-slate-400 flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-500/80 shrink-0 mt-0.5" />
                        <div>
                          <div>{b.addressRu}</div>
                          <div className="text-[10px] text-slate-500">{b.districtRu}</div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400 flex flex-col gap-1">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{b.openHoursRu}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span className="font-medium text-slate-300">{b.phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-700/40 flex items-center justify-between gap-2 mt-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditBranch(b);
                        }}
                        className="flex-1 py-1.5 px-3 rounded-lg bg-slate-700/50 hover:bg-amber-500/20 text-slate-300 hover:text-amber-300 border border-slate-600/50 hover:border-amber-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        <span>{isManager ? 'Подробнее' : 'Редактировать'}</span>
                      </button>
                      {isSuperadmin && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBranch(b.id, b.nameRu);
                          }}
                          className="p-1.5 rounded-lg bg-slate-700/30 hover:bg-red-500/20 text-slate-400 hover:text-red-300 border border-slate-600/30 hover:border-red-500/40 transition-colors"
                          title="Удалить филиал"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal: Add / Edit Branch */}
            {branchModalData && (
              <div
                className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
                onClick={() => setBranchModalData(null)}
              >
                <div
                  className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h3 className="font-bold text-white text-base flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-amber-400" />
                        {isCreatingBranch ? 'Новый магазин сети Алматы' : `Редактирование: ${branchModalData.nameRu}`}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {isCreatingBranch
                          ? 'Добавление филиала в общую сеть, остатки и логистику'
                          : `ID: ${branchModalData.id} • Slug: ${branchModalData.slug}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBranchModalData(null)}
                      className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleSaveBranch} className="space-y-4 text-xs">
                    {/* 1. Name RU & Name KZ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Название магазина (RU) *
                        </label>
                        <input
                          type="text"
                          required
                          value={branchModalData.nameRu}
                          onChange={(e) =>
                            setBranchModalData({ ...branchModalData, nameRu: e.target.value })
                          }
                          placeholder="Например: ТЦ Silk Way City"
                          className={`w-full px-3 py-2 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                            duplicateBranchName
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-slate-700 focus:border-amber-500'
                          }`}
                        />
                        {duplicateBranchName && (
                          <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Магазин с таким названием уже существует
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Название на казахском (KZ)
                        </label>
                        <input
                          type="text"
                          value={branchModalData.nameKz}
                          onChange={(e) =>
                            setBranchModalData({ ...branchModalData, nameKz: e.target.value })
                          }
                          placeholder="Мысалы: Silk Way City СОО"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>
                    </div>

                    {/* 2. District RU & District KZ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Район г. Алматы (RU)
                        </label>
                        <input
                          type="text"
                          value={branchModalData.districtRu}
                          onChange={(e) =>
                            setBranchModalData({ ...branchModalData, districtRu: e.target.value })
                          }
                          placeholder="Алмалинский район"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Аудан (KZ)
                        </label>
                        <input
                          type="text"
                          value={branchModalData.districtKz}
                          onChange={(e) =>
                            setBranchModalData({ ...branchModalData, districtKz: e.target.value })
                          }
                          placeholder="Алмалы ауданы"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* 3. Address RU & Address KZ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Точный адрес (RU) *
                        </label>
                        <input
                          type="text"
                          required
                          value={branchModalData.addressRu}
                          onChange={(e) =>
                            setBranchModalData({ ...branchModalData, addressRu: e.target.value })
                          }
                          placeholder="ул. Толе би 71"
                          className={`w-full px-3 py-2 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                            duplicateBranchAddress
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-slate-700 focus:border-amber-500'
                          }`}
                        />
                        {duplicateBranchAddress && (
                          <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Этот адрес уже закреплен за «{duplicateBranchAddress.nameRu}»
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Мекенжай (KZ)
                        </label>
                        <input
                          type="text"
                          value={branchModalData.addressKz}
                          onChange={(e) =>
                            setBranchModalData({ ...branchModalData, addressKz: e.target.value })
                          }
                          placeholder="Төле би к-сі 71"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* 4. Phone & Slug */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Телефон филиала *
                        </label>
                        <input
                          type="text"
                          required
                          value={branchModalData.phone}
                          onChange={(e) =>
                            setBranchModalData({
                              ...branchModalData,
                              phone: formatPhoneInput(e.target.value),
                            })
                          }
                          onBlur={() => {
                            if (branchModalData.phone) {
                              const fmt = formatKazakhstanPhone(branchModalData.phone);
                              if (fmt) {
                                setBranchModalData(prev =>
                                  prev ? { ...prev, phone: fmt } : null
                                );
                              }
                            }
                          }}
                          placeholder="+7 (727) 232-15-15"
                          className={`w-full px-3 py-2 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors ${
                            duplicateBranchPhone
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-slate-700 focus:border-amber-500'
                          }`}
                        />
                        {duplicateBranchPhone ? (
                          <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Номер уже используется филиалом «{duplicateBranchPhone.nameRu}»
                          </p>
                        ) : (
                          <p className="text-[10px] text-slate-500 mt-1">Формат: +7 (7XX) XXX-XX-XX</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          URL-идентификатор (Slug) *
                        </label>
                        <input
                          type="text"
                          required
                          value={branchModalData.slug}
                          onChange={(e) =>
                            setBranchModalData({
                              ...branchModalData,
                              slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                            })
                          }
                          placeholder="silk-way-city"
                          className={`w-full px-3 py-2 bg-slate-800 border rounded-xl text-white placeholder-slate-500 focus:outline-none transition-colors font-mono ${
                            duplicateBranchSlug
                              ? 'border-red-500 focus:border-red-500'
                              : 'border-slate-700 focus:border-amber-500'
                          }`}
                        />
                        {duplicateBranchSlug && (
                          <p className="text-[11px] text-red-400 font-medium mt-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Slug уже занят филиалом «{duplicateBranchSlug.nameRu}»
                          </p>
                        )}
                      </div>
                    </div>

                    {/* 5. Working Hours RU & KZ */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Режим работы (RU)
                        </label>
                        <input
                          type="text"
                          value={branchModalData.openHoursRu}
                          onChange={(e) =>
                            setBranchModalData({ ...branchModalData, openHoursRu: e.target.value })
                          }
                          placeholder="Пн-Вс: 10:00 - 22:00"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Жұмыс уақыты (KZ)
                        </label>
                        <input
                          type="text"
                          value={branchModalData.openHoursKz}
                          onChange={(e) =>
                            setBranchModalData({ ...branchModalData, openHoursKz: e.target.value })
                          }
                          placeholder="Дс-Жс: 10:00 - 22:00"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* 6. GPS Coordinates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Широта (Latitude, GPS)
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={branchModalData.latitude}
                          onChange={(e) =>
                            setBranchModalData({
                              ...branchModalData,
                              latitude: parseFloat(e.target.value) || 43.2389,
                            })
                          }
                          placeholder="43.2389"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-300 font-semibold mb-1">
                          Долгота (Longitude, GPS)
                        </label>
                        <input
                          type="number"
                          step="0.0001"
                          value={branchModalData.longitude}
                          onChange={(e) =>
                            setBranchModalData({
                              ...branchModalData,
                              longitude: parseFloat(e.target.value) || 76.8897,
                            })
                          }
                          placeholder="76.8897"
                          className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    </div>

                    {/* Footer Buttons */}
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                      <div>
                        {!isCreatingBranch && isSuperadmin && (
                          <button
                            type="button"
                            onClick={() => handleDeleteBranch(branchModalData.id, branchModalData.nameRu)}
                            className="px-3 py-2 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-950/40 border border-red-800/50 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Удалить магазин</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setBranchModalData(null)}
                          className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors"
                        >
                          {isManager ? 'Закрыть' : 'Отмена'}
                        </button>
                        {!isManager && (
                          <button
                            type="submit"
                            disabled={Boolean(
                              duplicateBranchName ||
                                duplicateBranchAddress ||
                                duplicateBranchPhone ||
                                duplicateBranchSlug
                            )}
                            className={`px-5 py-2 rounded-xl font-bold transition-all shadow-md ${
                              duplicateBranchName ||
                              duplicateBranchAddress ||
                              duplicateBranchPhone ||
                              duplicateBranchSlug
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60'
                                : 'bg-amber-500 hover:bg-amber-600 text-slate-950'
                            }`}
                          >
                            {isCreatingBranch ? 'Добавить магазин' : 'Сохранить изменения'}
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 9. TAB: SETTINGS & INTEGRATIONS (Superadmin ONLY) */}
        {activeTab === 'settings' && isSuperadmin && (
          <SettingsIntegrationsTab
            isSuperadmin={isSuperadmin}
            isAdmin={isAdmin}
            showToast={showToast}
            integrations={integrations}
            onIntegrationsChange={setIntegrations}
          />
        )}
      </main>
    </div>
  );
}
