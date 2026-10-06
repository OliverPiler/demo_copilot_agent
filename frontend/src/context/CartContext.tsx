/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export interface CartProduct {
  productId: number;
  name: string;
  price: number;
  imgName: string;
  discount?: number;
}

export interface CartItem {
  product: CartProduct;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  addToCart: (product: CartProduct, quantity: number) => void;
  setItemQuantity: (productId: number, quantity: number) => void;
  removeFromCart: (productId: number) => void;
  clearCart: () => void;
}

const CART_STORAGE_KEY = 'octocat-shopping-cart';
const CartContext = createContext<CartContextValue | undefined>(undefined);

function isCartItem(value: unknown): value is CartItem {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const item = value as { product?: unknown; quantity?: unknown };
  if (typeof item.product !== 'object' || item.product === null) {
    return false;
  }

  const product = item.product as Record<string, unknown>;
  return (
    typeof product.productId === 'number' &&
    Number.isFinite(product.productId) &&
    typeof product.name === 'string' &&
    typeof product.price === 'number' &&
    Number.isFinite(product.price) &&
    product.price >= 0 &&
    typeof product.imgName === 'string' &&
    (product.discount === undefined ||
      (typeof product.discount === 'number' &&
        Number.isFinite(product.discount) &&
        product.discount >= 0 &&
        product.discount <= 1)) &&
    typeof item.quantity === 'number' &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
}

function loadCart(): CartItem[] {
  try {
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!savedCart) {
      return [];
    }

    const parsed: unknown = JSON.parse(savedCart);
    if (!Array.isArray(parsed) || !parsed.every(isCartItem)) {
      console.error('Saved cart data is invalid; starting with an empty cart.');
      return [];
    }

    return parsed;
  } catch (error) {
    console.error('Unable to load the saved cart from local storage.', error);
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.error('Unable to save the cart to local storage.', error);
    }
  }, [items]);

  const addToCart = (product: CartProduct, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity <= 0) {
      throw new RangeError('Cart additions must have a positive whole-number quantity.');
    }

    setItems((currentItems) => {
      const existingItem = currentItems.find((item) => item.product.productId === product.productId);
      if (!existingItem) {
        return [...currentItems, { product, quantity }];
      }

      return currentItems.map((item) =>
        item.product.productId === product.productId
          ? { product, quantity: item.quantity + quantity }
          : item,
      );
    });
  };

  const setItemQuantity = (productId: number, quantity: number) => {
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new RangeError('Cart quantities must be non-negative whole numbers.');
    }

    setItems((currentItems) =>
      quantity === 0
        ? currentItems.filter((item) => item.product.productId !== productId)
        : currentItems.map((item) =>
            item.product.productId === productId ? { ...item, quantity } : item,
          ),
    );
  };

  const removeFromCart = (productId: number) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.product.productId !== productId),
    );
  };

  const clearCart = () => setItems([]);
  const itemCount = items.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, itemCount, addToCart, setItemQuantity, removeFromCart, clearCart }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
