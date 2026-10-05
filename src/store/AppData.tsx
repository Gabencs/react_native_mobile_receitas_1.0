import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productImageKeyById } from './productImages';

export interface SavedProduct {
  id: string;
  title: string;
  desc?: string;
  price: string | number;
  category: string;
  imageKey?: string;
}

export interface OrderRecord {
  id: string;
  createdAt: string;
  status: 'Confirmado' | 'Em preparo' | 'Concluído';
  items: { id: string; title: string; price: number; quantity: number; imageKey?: string }[];
  total: number;
  paymentMethod: string;
  paymentLabel: string;
  orderType: string;
  table?: string | null;
}

export interface AppSettings {
  darkMode: boolean;
  notificationsEnabled: boolean;
  deliveryEnabled: boolean;
  pickupEnabled: boolean;
  prepTimeMinutes: number;
  paymentMethods: { pix: boolean; cash: boolean; credit: boolean; debit: boolean; payAtCounter: boolean };
  restaurant: { name: string; address: string; phone: string; hours: string };
}

export type AppSettingsUpdate = Partial<Omit<AppSettings, 'paymentMethods' | 'restaurant'>> & {
  paymentMethods?: Partial<AppSettings['paymentMethods']>;
  restaurant?: Partial<AppSettings['restaurant']>;
};

export interface ServiceCall {
  id: string;
  table: string;
  message: string;
  status: 'pending' | 'attending';
  createdAt: string;
}

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  notificationsEnabled: true,
  deliveryEnabled: true,
  pickupEnabled: true,
  prepTimeMinutes: 30,
  paymentMethods: { pix: true, cash: true, credit: true, debit: true, payAtCounter: true },
  restaurant: {
    name: 'Fogo & Fumaça',
    address: 'Rua das Churrasqueiras, 123 - Centro, Santo Ângelo - RS',
    phone: '(55) 99999-9999',
    hours: 'Terça a Domingo - 18h às 23h30',
  },
};

const FAVORITES_KEY = '@cardapio-nativo/favorites-v1';
const ORDERS_KEY = '@cardapio-nativo/orders-v1';
const SETTINGS_KEY = '@cardapio-nativo/settings-v1';
const SERVICE_CALLS_KEY = '@cardapio-nativo/service-calls-v1';

interface AppDataContextType {
  favorites: SavedProduct[];
  orders: OrderRecord[];
  settings: AppSettings;
  serviceCalls: ServiceCall[];
  isAppDataReady: boolean;
  toggleFavorite: (product: SavedProduct) => void;
  isFavorite: (id: string) => boolean;
  addOrder: (order: OrderRecord) => Promise<void>;
  updateSettings: (updates: AppSettingsUpdate) => Promise<void>;
  requestWaiter: (table: string, message?: string) => Promise<{ call: ServiceCall; alreadyActive: boolean }>;
  setServiceCallAttending: (id: string) => Promise<void>;
  resolveServiceCall: (id: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<SavedProduct[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [serviceCalls, setServiceCalls] = useState<ServiceCall[]>([]);
  const [isAppDataReady, setIsAppDataReady] = useState(false);
  const settingsRef = useRef(settings);
  const serviceCallsRef = useRef(serviceCalls);

  useEffect(() => {
    let active = true;
    Promise.all([
      AsyncStorage.getItem(FAVORITES_KEY),
      AsyncStorage.getItem(ORDERS_KEY),
      AsyncStorage.getItem(SETTINGS_KEY),
      AsyncStorage.getItem(SERVICE_CALLS_KEY),
    ]).then(([savedFavorites, savedOrders, savedSettings, savedCalls]) => {
      if (!active) return;
      try {
        if (savedFavorites) setFavorites((JSON.parse(savedFavorites) as SavedProduct[]).map((product) => ({
          ...product,
          imageKey: productImageKeyById[product.id] || product.imageKey,
        })));
        if (savedOrders) setOrders(JSON.parse(savedOrders) as OrderRecord[]);
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings) as AppSettingsUpdate;
          const restored = {
            ...DEFAULT_SETTINGS,
            ...parsed,
            paymentMethods: { ...DEFAULT_SETTINGS.paymentMethods, ...parsed.paymentMethods },
            restaurant: { ...DEFAULT_SETTINGS.restaurant, ...parsed.restaurant },
          };
          settingsRef.current = restored;
          setSettings(restored);
        }
        if (savedCalls) {
          const restoredCalls = JSON.parse(savedCalls) as ServiceCall[];
          serviceCallsRef.current = restoredCalls;
          setServiceCalls(restoredCalls);
        }
      } catch (error) {
        console.warn('Não foi possível carregar os dados locais.', error);
      } finally {
        setIsAppDataReady(true);
      }
    }).catch((error) => {
      console.warn('Não foi possível carregar os dados locais.', error);
      if (active) setIsAppDataReady(true);
    });
    return () => { active = false; };
  }, []);

  const toggleFavorite = (product: SavedProduct) => {
    setFavorites((current) => {
      const next = current.some((item) => item.id === product.id)
        ? current.filter((item) => item.id !== product.id)
        : [...current, product];
      AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(next)).catch((error) =>
        console.warn('Não foi possível salvar os favoritos.', error),
      );
      return next;
    });
  };

  const addOrder = async (order: OrderRecord) => {
    const next = [order, ...orders];
    setOrders(next);
    await AsyncStorage.setItem(ORDERS_KEY, JSON.stringify(next));
  };

  const updateSettings = useCallback(async (updates: AppSettingsUpdate) => {
    const current = settingsRef.current;
    const next: AppSettings = {
      ...current,
      ...updates,
      paymentMethods: { ...current.paymentMethods, ...updates.paymentMethods },
      restaurant: { ...current.restaurant, ...updates.restaurant },
    };
    settingsRef.current = next;
    setSettings(next);
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  }, []);

  const writeCalls = useCallback(async (next: ServiceCall[]) => {
    serviceCallsRef.current = next;
    setServiceCalls(next);
    await AsyncStorage.setItem(SERVICE_CALLS_KEY, JSON.stringify(next));
  }, []);

  const requestWaiter = useCallback(async (table: string, message = 'Solicitou atendimento') => {
    const cleanTable = String(table).trim().replace(/^mesa\s*/i, '');
    if (!cleanTable) throw new Error('Não foi possível identificar o número da mesa.');
    const existing = serviceCallsRef.current.find((call) => call.table === cleanTable);
    if (existing) return { call: existing, alreadyActive: true };
    const call: ServiceCall = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      table: cleanTable,
      message,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    await writeCalls([call, ...serviceCallsRef.current].slice(0, 50));
    return { call, alreadyActive: false };
  }, [writeCalls]);

  const setServiceCallAttending = useCallback(async (id: string) => {
    const next = serviceCallsRef.current.map((call) => call.id === id ? { ...call, status: 'attending' as const } : call);
    await writeCalls(next);
  }, [writeCalls]);

  const resolveServiceCall = useCallback(async (id: string) => {
    await writeCalls(serviceCallsRef.current.filter((call) => call.id !== id));
  }, [writeCalls]);

  const value = useMemo(() => ({
    favorites,
    orders,
    settings,
    serviceCalls,
    isAppDataReady,
    toggleFavorite,
    isFavorite: (id: string) => favorites.some((item) => item.id === id),
    addOrder,
    updateSettings,
    requestWaiter,
    setServiceCallAttending,
    resolveServiceCall,
  }), [favorites, orders, settings, serviceCalls, isAppDataReady, updateSettings, requestWaiter, setServiceCallAttending, resolveServiceCall]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) throw new Error('useAppData deve ser usado dentro de AppDataProvider');
  return context;
}

export function getAppPalette(darkMode: boolean) {
  return darkMode ? {
    background: '#121212',
    surface: '#1E1E1E',
    raised: '#292929',
    border: '#3B3B3B',
    text: '#F5F5F5',
    muted: '#B0B0B0',
    primary: '#F07818',
    primarySoft: '#462C18',
  } : {
    background: '#FFF8F1',
    surface: '#FFFFFF',
    raised: '#F5E8DA',
    border: '#E8D6C4',
    text: '#302219',
    muted: '#817165',
    primary: '#F07818',
    primarySoft: '#FFF0E2',
  };
}
