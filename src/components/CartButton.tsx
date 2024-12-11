'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';

interface CartButtonProps {
  onClick: () => void;
}

export default function CartButton({ onClick }: CartButtonProps) {
  const { state: cart } = useCart();
  
  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  if (totalItems === 0) return null;

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        whileHover={{ scale: 1.1 }}
        onClick={onClick}
        className="fixed bottom-8 right-8 bg-green-600 text-white rounded-full p-4 shadow-lg z-50 flex items-center space-x-2"
      >
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span className="font-bold">{totalItems}</span>
      </motion.button>
    </AnimatePresence>
  );
}
