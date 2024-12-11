'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { CartItem, SquareItem, SquareVariation } from '../types/square';

interface CartState {
  items: CartItem[];
  total: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { itemId: string; variationId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: CartItem }
  | { type: 'CLEAR_CART' };

interface CartContextType {
  state: CartState;
  addItem: (item: CartItem, items?: SquareItem[]) => void;
  removeItem: (itemId: string, variationId: string) => void;
  updateQuantity: (item: CartItem) => void;
  clearCart: () => void;
  getItemQuantity: (itemId: string, variationId: string) => number;
  calculateTotal: (items: SquareItem[], variations: Record<string, SquareVariation[]>) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const getStandSize = (treeName: string): string => {
  const size = treeName.toLowerCase();
  if (size.includes('3-4') || size.includes('4-5')) return 'small';
  if (size.includes('5-6')) return 'medium';
  if (size.includes('6-7') || size.includes('7-8')) return 'large';
  if (size.includes('8-9')) return 'x-large';
  return 'small'; // default to small if no match
};

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItemIndex = state.items.findIndex(
        item => item.itemId === action.payload.itemId && item.variationId === action.payload.variationId
      );

      if (existingItemIndex > -1) {
        // Update quantity if item exists
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex] = {
          ...updatedItems[existingItemIndex],
          quantity: updatedItems[existingItemIndex].quantity + action.payload.quantity
        };
        return { ...state, items: updatedItems };
      }

      // Add new item if it doesn't exist
      return { ...state, items: [...state.items, action.payload] };
    }

    case 'REMOVE_ITEM': {
      return {
        ...state,
        items: state.items.filter(
          item => !(item.itemId === action.payload.itemId && item.variationId === action.payload.variationId)
        )
      };
    }

    case 'UPDATE_QUANTITY': {
      return {
        ...state,
        items: state.items.map(item =>
          item.itemId === action.payload.itemId && item.variationId === action.payload.variationId
            ? { ...item, quantity: action.payload.quantity }
            : item
        )
      };
    }

    case 'CLEAR_CART':
      return { ...state, items: [] };

    default:
      return state;
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  const addItem = (item: CartItem, catalogItems?: SquareItem[]) => {
    dispatch({ type: 'ADD_ITEM', payload: item });

    // If catalog items are provided and this is a tree, suggest a stand
    if (catalogItems) {
      const treeItem = catalogItems.find(i => i.id === item.itemId);
      const standItem = catalogItems.find(i => i.name.toLowerCase().includes('water bowl & stand'));

      if (treeItem && standItem) {
        const treeVariation = treeItem.variations.find(v => v.id === item.variationId);
        if (treeVariation) {
          const standSize = getStandSize(treeVariation.name);
          const standVariation = standItem.variations.find(v => 
            v.name.toLowerCase().includes(standSize)
          );

          if (standVariation) {
            // Check if this stand size is already in the cart
            const existingStand = state.items.find(i => 
              i.itemId === standItem.id && i.variationId === standVariation.id
            );

            if (!existingStand) {
              // Add the corresponding stand
              dispatch({
                type: 'ADD_ITEM',
                payload: {
                  itemId: standItem.id,
                  variationId: standVariation.id,
                  quantity: 1
                }
              });
            }
          }
        }
      }
    }
  };

  const removeItem = (itemId: string, variationId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: { itemId, variationId } });
  };

  const updateQuantity = (item: CartItem) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: item });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getItemQuantity = (itemId: string, variationId: string): number => {
    const item = state.items.find(
      item => item.itemId === itemId && item.variationId === variationId
    );
    return item?.quantity || 0;
  };

  const calculateTotal = (items: SquareItem[], variations: Record<string, SquareVariation[]>): number => {
    return state.items.reduce((total, cartItem) => {
      const item = items.find(i => i.id === cartItem.itemId);
      if (!item) return total;

      const variation = variations[item.id]?.find(v => v.id === cartItem.variationId);
      if (!variation) return total;

      return total + (variation.price.amount * cartItem.quantity);
    }, 0);
  };

  return (
    <CartContext.Provider
      value={{
        state,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        getItemQuantity,
        calculateTotal
      }}
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
