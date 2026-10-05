import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { productImageKeyById } from './productImages';

export interface CartItem {
  id: string;
  title: string;
  desc?: string;
  price: string | number;
  icon?: string;
  badge?: string | null;
  category?: string;
  imageKey?: string;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  mesa: string | null;
  setMesa: (mesa: string | null) => void;
  addToCart: (product: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
  isCartReady: boolean;
}

const CART_KEY = '@cardapio-nativo/cart-v1';
const TABLE_KEY = '@cardapio-nativo/table-v1';
const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [mesa, setMesaState] = useState<string | null>(null);
  const [isCartReady, setIsCartReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([AsyncStorage.getItem(CART_KEY), AsyncStorage.getItem(TABLE_KEY)]).then(([saved, savedTable]) => {
      if (active && savedTable) setMesaState(savedTable);
      if (active && saved) {
        try {
          setItems((JSON.parse(saved) as CartItem[]).map((item) => ({
            ...item,
            imageKey: productImageKeyById[item.id] || item.imageKey,
          })));
        } catch { AsyncStorage.removeItem(CART_KEY); }
      }
    }).catch((error) => console.warn('Não foi possível recuperar o carrinho.', error))
      .finally(() => { if (active) setIsCartReady(true); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (isCartReady) AsyncStorage.setItem(CART_KEY, JSON.stringify(items)).catch((error) =>
      console.warn('Não foi possível salvar o carrinho.', error),
    );
  }, [items, isCartReady]);

  const addToCart = (product: Omit<CartItem, 'quantity'>) => {
    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.id === product.id);
      return existingItem
        ? currentItems.map((item) => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
        : [...currentItems, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.id === productId);
      if (!existing) return currentItems;
      return existing.quantity <= 1
        ? currentItems.filter((item) => item.id !== productId)
        : currentItems.map((item) => item.id === productId ? { ...item, quantity: item.quantity - 1 } : item);
    });
  };

  const clearCart = () => setItems([]);
  const setMesa = useCallback((table: string | null) => {
    setMesaState(table);
    if (table) AsyncStorage.setItem(TABLE_KEY, table).catch((error) => console.warn('Não foi possível salvar a mesa.', error));
    else AsyncStorage.removeItem(TABLE_KEY).catch((error) => console.warn('Não foi possível limpar a mesa.', error));
  }, []);
  const cartCount = items.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = items.reduce((total, item) => {
    const parsed = typeof item.price === 'number' ? item.price : Number(item.price.replace(',', '.'));
    return total + (Number.isFinite(parsed) ? parsed : 0) * item.quantity;
  }, 0);

  return (
    <CartContext.Provider value={{ items, mesa, setMesa, addToCart, removeFromCart, clearCart, cartCount, cartTotal, isCartReady }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart deve ser utilizado dentro de um CartProvider');
  return context;
};
