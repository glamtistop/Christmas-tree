'use client';

import { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import Image from 'next/image';
import { SquareCatalogResponse, SquareItem, SquareVariation } from '../types/square';
import { formatPrice } from '../utils/square';
import { ParallaxBanner2 } from './ParallaxBanner2';
import { useCart } from '../contexts/CartContext';
import CheckoutModal from './CheckoutModal';
import CartButton from './CartButton';

export default function ChristmasApp() {
  const [showCheckout, setShowCheckout] = useState(false);
  const [catalog, setCatalog] = useState<SquareCatalogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const { addItem, getItemQuantity, state: cart } = useCart();

  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);

  const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  // Update header visibility based on scroll position
  scrollY.onChange((latest) => {
    setHidden(latest > 300);
  });

  // Parallax effect for banner
  const bannerY = useTransform(scrollY, [0, 500], [0, 150]);

  useEffect(() => {
    async function fetchCatalog() {
      try {
        console.log('Fetching catalog...');
        setLoading(true);
        setError(null);
        const response = await fetch('/api/catalog');
        console.log('Response status:', response.status);
        
        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error response:', errorData);
          throw new Error(errorData.details || 'Failed to fetch catalog');
        }

        const data = await response.json();
        console.log('Catalog data received:', {
          itemCount: data.items?.length || 0,
          items: data.items?.map((item: SquareItem) => ({
            name: item.name,
            variationCount: item.variations?.length || 0
          }))
        });

        setCatalog(data);
      } catch (err) {
        console.error('Error fetching catalog:', err);
        setError(err instanceof Error ? err.message : 'An error occurred while fetching the catalog');
      } finally {
        setLoading(false);
      }
    }

    fetchCatalog();
  }, []);

  const scrollToTrees = () => {
    const treesSection = document.getElementById('available-trees');
    if (treesSection) {
      treesSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleVariantChange = (itemId: string, variantId: string) => {
    setSelectedVariants(prev => ({
      ...prev,
      [itemId]: variantId
    }));
  };

  const getSelectedVariant = (item: SquareItem): SquareVariation | undefined => {
    const selectedVariantId = selectedVariants[item.id];
    return item.variations.find(v => v.id === selectedVariantId) || item.variations[0];
  };

  const handleAddToCart = (itemId: string, variationId: string) => {
    addItem({
      itemId,
      variationId,
      quantity: 1
    }, catalog?.items);
  };

  const treeCareGuide = [
    {
      title: "Water Care",
      icon: "💧",
      tips: [
        "Check water level daily - trees can drink up to a gallon per day",
        "Always maintain water level above the cut end",
        "Use warm water for the first fill to help the tree start drinking",
        "Never let the water level drop below the base of the trunk"
      ]
    },
    {
      title: "Location & Setup",
      icon: "🏠",
      tips: [
        "Keep away from heat sources (fireplaces, radiators, sunny windows)",
        "Place on a stable, level surface",
        "Position away from high-traffic areas to prevent accidents",
        "Ensure the tree stand is appropriate for your tree&apos;s size"
      ]
    },
    {
      title: "Safety Tips",
      icon: "🔒",
      tips: [
        "Check holiday lights for frayed wires or damage",
        "Turn off tree lights when leaving home or going to bed",
        "Keep pets away from tree water",
        "Regularly check for fallen needles and sweep as needed"
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ 
          opacity: hidden ? 0 : 1,
          y: hidden ? -100 : 0
        }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 bg-black/30 backdrop-blur-md z-20 py-4"
      >
        <div className="max-w-6xl mx-auto px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">
            Christmas Trees
          </h1>
          <div className="flex items-center space-x-6">
            <button
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-semibold relative"
              onClick={() => setShowCheckout(true)}
            >
              Book Delivery
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
            </a>
            <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
            </a>
          </div>
        </div>
      </motion.div>

      {/* First Hero Banner */}
      <section className="relative h-[600px] w-full overflow-hidden">
        {/* Banner Image with Parallax */}
        <motion.div 
          className="absolute inset-0"
          style={{ y: bannerY }}
        >
          <Image
            src="/banner.jpg"
            alt="Christmas Tree Banner"
            fill
            style={{ 
              objectFit: 'cover',
              objectPosition: 'center 30%',
              scale: 1.2 // Slightly larger to prevent white edges during parallax
            }}
            priority
          />
        </motion.div>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="banner-title text-6xl md:text-8xl lg:text-9xl text-white mb-4"
          >
            Christmas Trees
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="banner-subtitle text-xl md:text-2xl lg:text-3xl font-semibold uppercase tracking-wider mb-8"
          >
            Find your PERFECT Tree
          </motion.p>
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            onClick={scrollToTrees}
            className="px-8 py-4 bg-white/20 backdrop-blur-md border border-white/30 hover:bg-white/30 text-white text-xl font-bold rounded-lg transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            See Available Trees
          </motion.button>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Fresh Cut Trees</h3>
            <p className="text-gray-600">Premium Fraser Fir, Balsam Fir, and Scotch Pine trees freshly cut for maximum longevity</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Artificial Trees</h3>
            <p className="text-gray-600">High-quality artificial trees that look realistic and last for many seasons</p>
          </div>
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Pre-lit Trees</h3>
            <p className="text-gray-600">Convenient pre-lit options with warm white or multicolor LED lights</p>
          </div>
        </div>
      </section>

      {/* Available Trees Section */}
      <section id="available-trees" className="py-16 px-4 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Available Trees</h2>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading available trees...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6 inline-block">
                <p className="text-red-600 mb-2">Unable to load trees</p>
                <p className="text-sm text-red-500">{error}</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : catalog?.items && catalog.items.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8">
              {catalog.items.map((tree) => {
                const selectedVariant = getSelectedVariant(tree);
                const quantity = selectedVariant ? getItemQuantity(tree.id, selectedVariant.id) : 0;
                
                return (
                  <motion.div
                    key={tree.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="bg-white rounded-2xl overflow-hidden hover:transform hover:scale-105 transition-all duration-300 shadow-lg"
                  >
                    <div className="h-72 bg-gradient-to-br from-green-700 to-green-900 relative overflow-hidden">
                      {tree.imageIds?.[0] && catalog.images.find(img => img.id === tree.imageIds![0]) ? (
                        <Image
                          src={catalog.images.find(img => img.id === tree.imageIds![0])!.url}
                          alt={tree.name}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(120,190,120,0.3)_0%,rgba(0,0,0,0)_60%)]"></div>
                      )}
                    </div>
                    <div className="p-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{tree.name}</h3>
                      <p className="text-gray-600 mb-4">{tree.description}</p>
                      <div className="mb-4">
                        <h4 className="text-gray-900 font-semibold mb-2">Available Sizes:</h4>
                        <div className="flex flex-wrap gap-2">
                          {tree.variations.map((variation) => (
                            <button
                              key={variation.id}
                              onClick={() => handleVariantChange(tree.id, variation.id)}
                              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                                selectedVariant?.id === variation.id
                                  ? 'bg-green-600 text-white'
                                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                              }`}
                              disabled={!variation.available}
                            >
                              {variation.name}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between items-center mt-6">
                        <span className="text-2xl font-bold text-gray-900">
                          {selectedVariant && formatPrice(selectedVariant.price.amount)}
                        </span>
                        {quantity > 0 ? (
                          <div className="flex items-center space-x-2">
                            <span className="text-green-600">In Cart: {quantity}</span>
                            <button
                              onClick={() => handleAddToCart(tree.id, selectedVariant!.id)}
                              className="px-2 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                              Add Another
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => selectedVariant && handleAddToCart(tree.id, selectedVariant.id)}
                            className={`px-4 py-2 rounded-lg transition-colors ${
                              selectedVariant?.available
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-gray-300 cursor-not-allowed text-gray-500'
                            }`}
                            disabled={!selectedVariant?.available}
                          >
                            {selectedVariant?.available ? 'Add to Cart' : 'Sold Out'}
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No trees available at the moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* Second Banner */}
      <ParallaxBanner2 />

      {/* Tree Care Guide Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Tree Care Guide</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {treeCareGuide.map((category) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-gray-50 rounded-2xl p-6 hover:bg-gray-100 transition-colors shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <span className="text-3xl mr-3">{category.icon}</span>
                  <h3 className="text-2xl font-bold text-gray-900">{category.title}</h3>
                </div>
                <ul className="space-y-3">
                  {category.tips.map((tip, index) => (
                    <li key={index} className="text-gray-600 flex items-start">
                      <span className="text-green-500 mr-2">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 mt-16 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Payment Methods */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Payment Methods</h3>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white/10 p-3 rounded-lg">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/>
                  </svg>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                  </svg>
                </div>
                <div className="bg-white/10 p-3 rounded-lg">
                  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm-1 14H5c-.55 0-1-.45-1-1V7c0-.55.45-1 1-1h14c.55 0 1 .45 1 1v10c0 .55-.45 1-1 1z"/>
                  </svg>
                </div>
              </div>
              <p className="text-white/60 mt-2 text-sm">
                We accept all major credit cards, Apple Pay, Google Pay, and other payment methods through Square
              </p>
            </div>

            {/* Contact Info (Placeholder) */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Contact Us</h3>
              <p className="text-white/80">Contact information coming soon...</p>
            </div>

            {/* Social Links */}
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Follow Us</h3>
              <div className="flex space-x-4">
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a href="https://tiktok.com" target="_blank" rel="noopener noreferrer" className="text-white/80 hover:text-white transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-white/60">© 2024 Christmas Trees. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        catalog={catalog}
      />

      {/* Floating Cart Button */}
      <CartButton onClick={() => setShowCheckout(true)} />
    </div>
  );
}
