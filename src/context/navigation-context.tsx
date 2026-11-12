'use client';

import React, { createContext, useContext, useState } from 'react';

export type NavTabId = 'overview' | 'jadwal' | 'pelanggan' | 'paket' | 'keuangan';

interface NavigationContextType {
  activeTab: NavTabId;
  setActiveTab: (tab: NavTabId) => void;
}

const NavigationContext = createContext<NavigationContextType>({
  activeTab: 'overview',
  setActiveTab: () => {},
});

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [activeTab, setActiveTab] = useState<NavTabId>('overview');

  return (
    <NavigationContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return context;
}
