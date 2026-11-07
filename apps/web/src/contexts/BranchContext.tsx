'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  ALL_BRANCHES,
  DEFAULT_BRANCH,
  BRANCH_COOKIE_NAME,
  resolveBranch,
  getStoredBranches,
  type StoreBranch,
} from '../lib/branch-constants';

export { ALL_BRANCHES, DEFAULT_BRANCH, type StoreBranch };

interface BranchContextType {
  selectedBranch: StoreBranch;
  branches: StoreBranch[];
  selectBranch: (branchIdOrSlug: string) => void;
  isLoaded: boolean;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [branches, setBranches] = useState<StoreBranch[]>(ALL_BRANCHES);
  const [selectedBranch, setSelectedBranch] = useState<StoreBranch>(DEFAULT_BRANCH);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadedBranches = getStoredBranches();
    setBranches(loadedBranches);

    const getCookie = (name: string): string | null => {
      if (typeof document === 'undefined') return null;
      const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
      const val = match ? match[3] : undefined;
      return val ? decodeURIComponent(val) : null;
    };

    const savedId =
      getCookie(BRANCH_COOKIE_NAME) ||
      (typeof localStorage !== 'undefined' ? localStorage.getItem(BRANCH_COOKIE_NAME) : null);
    if (savedId) {
      setSelectedBranch(resolveBranch(savedId));
    } else if (loadedBranches[0]) {
      setSelectedBranch(loadedBranches[0]);
    }
    setIsLoaded(true);
  }, []);

  const selectBranch = (branchIdOrSlug: string) => {
    const target = resolveBranch(branchIdOrSlug);
    setSelectedBranch(target);

    // Persist to cookie (30 days) and localStorage
    if (typeof document !== 'undefined') {
      document.cookie = `${BRANCH_COOKIE_NAME}=${target.id}; Path=/; Max-Age=2592000; SameSite=Lax`;
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BRANCH_COOKIE_NAME, target.id);
    }
  };

  return (
    <BranchContext.Provider
      value={{ selectedBranch, branches, selectBranch, isLoaded }}
    >
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  const ctx = useContext(BranchContext);
  if (!ctx) {
    throw new Error('useBranch must be used within BranchProvider');
  }
  return ctx;
}
