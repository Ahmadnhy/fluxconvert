'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface QuotaContextType {
  refreshQuota: () => void;
  registerRefresh: (fn: () => Promise<void>) => void;
}

const QuotaContext = createContext<QuotaContextType | undefined>(undefined);

export function QuotaProvider({ children }: { children: ReactNode }) {
  const [refreshFn, setRefreshFn] = useState<(() => Promise<void>) | null>(null);

  const registerRefresh = useCallback((fn: () => Promise<void>) => {
    setRefreshFn(() => fn);
  }, []);

  const refreshQuota = useCallback(() => {
    if (refreshFn) {
      refreshFn();
    }
  }, [refreshFn]);

  return (
    <QuotaContext.Provider value={{ refreshQuota, registerRefresh }}>
      {children}
    </QuotaContext.Provider>
  );
}

export function useQuota() {
  const context = useContext(QuotaContext);
  if (context === undefined) {
    throw new Error('useQuota must be used within a QuotaProvider');
  }
  return context;
}
