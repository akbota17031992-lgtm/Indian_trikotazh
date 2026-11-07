'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface CustomerUser {
  id: string;
  phone: string;
  fullName: string;
  name?: string; // alias for fullName
  email?: string;
  role: 'customer' | 'store_manager' | 'admin';
  bonusesKzt: number;
  bonusBalance?: number; // alias for bonusesKzt
  ordersCount: number;
}

interface AuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  login: (userData: CustomerUser) => void;
  logout: () => void;
  refreshSession: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = 'indiatrikotaj_customer_user';
const ADMIN_SESSION_STORAGE_KEY = 'indiatrikotaj_admin_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const syncActiveUser = useCallback(() => {
    try {
      // 1. Check if an active staff/admin session exists in indiatrikotaj_admin_session
      const rawAdmin = localStorage.getItem(ADMIN_SESSION_STORAGE_KEY);
      if (rawAdmin) {
        const adminAcc = JSON.parse(rawAdmin);
        if (adminAcc && adminAcc.name) {
          const staffUser: CustomerUser = {
            id: `cust-staff-${adminAcc.id}`,
            phone: adminAcc.phone || '',
            fullName: adminAcc.name,
            name: adminAcc.name,
            email: adminAcc.email || undefined,
            role: adminAcc.role === 'manager' ? 'store_manager' : 'admin',
            bonusesKzt: 500,
            bonusBalance: 500,
            ordersCount: 0,
          };
          setUser(staffUser);
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(staffUser));
          return;
        }
      }

      // 2. Otherwise load customer user
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error('Error syncing active user:', e);
    }
  }, []);

  useEffect(() => {
    syncActiveUser();

    const handleStorageChange = () => {
      syncActiveUser();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth_state_changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth_state_changed', handleStorageChange);
    };
  }, [syncActiveUser]);

  const login = (userData: CustomerUser) => {
    setUser(userData);
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));

      // If a regular retail customer logged in, clear any stale admin session
      // so customer cannot accidentally enter a previous employee's session!
      if (userData.role === 'customer') {
        localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      }

      window.dispatchEvent(new Event('auth_state_changed'));
    } catch (e) {
      console.error(e);
    }
    setIsAuthModalOpen(false);
  };

  const logout = () => {
    setUser(null);
    try {
      // Clear both customer and admin sessions on logout for complete security
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(ADMIN_SESSION_STORAGE_KEY);
      window.dispatchEvent(new Event('auth_state_changed'));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAuthModalOpen,
        openAuthModal: () => setIsAuthModalOpen(true),
        closeAuthModal: () => setIsAuthModalOpen(false),
        login,
        logout,
        refreshSession: syncActiveUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
