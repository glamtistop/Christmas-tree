'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatePresence } from 'framer-motion';
import { useCart } from '../contexts/CartContext';
import { formatPrice, STORE_CONFIG, calculateDeliveryFee, getNextDayDate, getDeliveryTimeSlots } from '../utils/square';
import { SquareCatalogResponse, SquareItem, SquareVariation } from '../types/square';

interface DeliveryAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  zip: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  catalog: SquareCatalogResponse | null;
}

type FulfillmentType = 'pickup' | 'delivery';
type CheckoutStep = 'details' | 'summary';

interface GeocodingResult {
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
}

interface GeocodingResponse {
  results: GeocodingResult[];
}

export default function CheckoutModal({ isOpen, onClose, catalog }: CheckoutModalProps) {
  const { state: cart, removeItem, updateQuantity, clearCart, addItem } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [selectedLocation, setSelectedLocation] = useState<string>(STORE_CONFIG.locations[0].id);
  const [fulfillmentType, setFulfillmentType] = useState<FulfillmentType>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: ''
  });
  const [deliveryFeeName, setDeliveryFeeName] = useState<string | undefined>();
  const [pickupDate] = useState(getNextDayDate());
  const [pickupTime, setPickupTime] = useState('');
  const [step, setStep] = useState<CheckoutStep>('details');

  // Get available time slots
  const timeSlots = getDeliveryTimeSlots();

  // Calculate cart subtotal
  const calculateSubtotal = () => {
    if (!catalog) return 0;
    return cart.items.reduce((total, item) => {
      const catalogItem = catalog.items.find((i: SquareItem) => i.id === item.itemId);
      const variation = catalogItem?.variations.find((v: SquareVariation) => v.id === item.variationId);
      if (!variation?.price?.amount) return total;
      return total + (variation.price.amount * item.quantity);
    }, 0);
  };

  // Get delivery fee amount
  const getDeliveryFeeAmount = () => {
    if (!deliveryFeeName || !catalog) return 0;
    console.log('Looking for delivery fee item with name:', deliveryFeeName);
    console.log('Available catalog items:', catalog.items.map((i: SquareItem) => ({ id: i.id, name: i.name })));
    const deliveryItem = catalog.items.find((i: SquareItem) => i.name === deliveryFeeName);
    console.log('Found delivery item:', deliveryItem);
    if (!deliveryItem?.variations[0]?.price?.amount) return 0;
    return deliveryItem.variations[0].price.amount;
  };

  // Calculate total with delivery fee
  const calculateTotal = () => {
    return calculateSubtotal() + (fulfillmentType === 'delivery' ? getDeliveryFeeAmount() : 0);
  };

  const handleQuantityChange = (itemId: string, variationId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId, variationId);
    } else {
      updateQuantity({ itemId, variationId, quantity: newQuantity });
    }
  };

  const handleFulfillmentTypeChange = (type: FulfillmentType) => {
    setFulfillmentType(type);
    if (type === 'pickup') {
      setDeliveryFeeName(undefined);
    }
  };

  const handleAddressChange = async (field: keyof DeliveryAddress, value: string) => {
    const newAddress = { ...deliveryAddress, [field]: value };
    setDeliveryAddress(newAddress);

    // Calculate delivery fee when all required fields are filled
    if (newAddress.addressLine1 && newAddress.city && newAddress.state && newAddress.zip) {
      try {
        const fullAddress = [
          newAddress.addressLine1,
          newAddress.addressLine2,
          newAddress.city,
          newAddress.state,
          newAddress.zip
        ].filter(Boolean).join(', ');

        const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`);
        const data = await response.json() as GeocodingResponse;
        
        if (data.results && data.results[0]) {
          const { lat, lng } = data.results[0].geometry.location;
          const location = STORE_CONFIG.locations.find(loc => loc.id === selectedLocation);
          if (!location) throw new Error('Invalid store location');

          // Calculate distance from store
          const R = 3959; // Earth's radius in miles
          const dLat = (lat - location.address.lat) * (Math.PI / 180);
          const dLon = (lng - location.address.lng) * (Math.PI / 180);
          const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(location.address.lat * (Math.PI / 180)) * Math.cos(lat * (Math.PI / 180)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
          const distance = Math.round(R * c * 10) / 10;

          console.log('Calculated distance:', distance, 'miles');

          // Get delivery fee name based on distance
          const feeName = calculateDeliveryFee(distance);
          console.log('Calculated delivery fee name:', feeName);
          
          if (!feeName) {
            setError(`Sorry, we only deliver within 8 miles of our location.`);
            setDeliveryFeeName(undefined);
          } else {
            setError(undefined);
            setDeliveryFeeName(feeName);
          }
        } else {
          setError('Invalid address');
          setDeliveryFeeName(undefined);
        }
      } catch (err) {
        console.error('Error calculating delivery fee:', err);
        setError('Error calculating delivery fee');
        setDeliveryFeeName(undefined);
      }
    } else {
      setDeliveryFeeName(undefined);
    }
  };

  const handleProceedToSummary = () => {
    if (!catalog) return;

    if (fulfillmentType === 'delivery' && !deliveryFeeName) {
      setError('Please enter a valid delivery address');
      return;
    }

    if (fulfillmentType === 'pickup' && !pickupTime) {
      setError('Please select a pickup time');
      return;
    }

    // Find delivery item by name and add it to cart if needed
    if (fulfillmentType === 'delivery' && deliveryFeeName) {
      const deliveryItem = catalog.items.find((i: SquareItem) => i.name === deliveryFeeName);
      if (deliveryItem?.variations[0]) {
        // Add delivery fee to cart
        addItem({
          itemId: deliveryItem.id,
          variationId: deliveryItem.variations[0].id,
          quantity: 1
        });
      }
    }

    setStep('summary');
  };

  const handleBackToDetails = () => {
    if (!catalog) return;

    // Remove delivery fee from cart if it exists
    if (fulfillmentType === 'delivery' && deliveryFeeName) {
      const deliveryItem = catalog.items.find((i: SquareItem) => i.name === deliveryFeeName);
      if (deliveryItem?.variations[0]) {
        removeItem(deliveryItem.id, deliveryItem.variations[0].id);
      }
    }
    setStep('details');
  };

  const handleCheckout = async () => {
    try {
      setLoading(true);
      setError(undefined);

      const requestPayload = {
        cartItems: cart.items,
        locationId: selectedLocation,
        fulfillmentType,
        ...(fulfillmentType === 'delivery' ? {
          deliveryAddress
        } : {
          pickupDate,
          pickupTime
        })
      };

      console.log('Sending checkout request:', JSON.stringify(requestPayload, null, 2));

      // Create checkout URL with Square
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestPayload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Checkout API error response:', data);
        throw new Error(data.error || `Checkout failed: ${response.status}`);
      }

      // Clear cart and close modal
      clearCart();
      onClose();

      // Redirect to Square's checkout page
      window.location.href = data.paymentLink.url;
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during checkout');
    } finally {
      setLoading(false);
    }
  };

  const renderSummary = () => {
    if (!catalog) return null;

    return (
      <div>
        <h3 className="text-xl font-semibold mb-4">Order Summary</h3>
        <div className="space-y-4">
          {cart.items.map((item) => {
            const catalogItem = catalog.items.find((i: SquareItem) => i.id === item.itemId);
            const variation = catalogItem?.variations.find((v: SquareVariation) => v.id === item.variationId);
            if (!variation?.price?.amount) return null;
            
            return (
              <div key={`${item.itemId}-${item.variationId}`} className="flex justify-between">
                <div>
                  <p className="font-medium">{catalogItem?.name}</p>
                  <p className="text-sm text-gray-500">{variation?.name}</p>
                  <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                </div>
                <span className="font-semibold">
                  {formatPrice(variation.price.amount * item.quantity)}
                </span>
              </div>
            );
          })}
        </div>

        <div className="mt-6 border-t pt-4">
          <h4 className="font-semibold mb-2">{fulfillmentType === 'delivery' ? 'Delivery' : 'Pickup'} Details</h4>
          {fulfillmentType === 'delivery' ? (
            <div className="text-sm text-gray-600">
              <p>{deliveryAddress.addressLine1}</p>
              {deliveryAddress.addressLine2 && <p>{deliveryAddress.addressLine2}</p>}
              <p>{`${deliveryAddress.city}, ${deliveryAddress.state} ${deliveryAddress.zip}`}</p>
            </div>
          ) : (
            <div className="text-sm text-gray-600">
              <p>Pickup Date: {new Date(pickupDate).toLocaleDateString()}</p>
              <p>Pickup Time: {pickupTime}</p>
              <p>Location: {STORE_CONFIG.locations.find(loc => loc.id === selectedLocation)?.name}</p>
            </div>
          )}
        </div>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex justify-between mb-2">
            <span>Subtotal:</span>
            <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
          </div>
          {fulfillmentType === 'delivery' && (
            <div className="flex justify-between mb-2">
              <span>Delivery Fee:</span>
              <span className="font-semibold">{formatPrice(getDeliveryFeeAmount())}</span>
            </div>
          )}
          <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
            <span>Total:</span>
            <span>{formatPrice(calculateTotal())}</span>
          </div>
        </div>

        <div className="mt-6 flex space-x-4">
          <button
            onClick={handleBackToDetails}
            className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Back
          </button>
          <button
            onClick={handleCheckout}
            disabled={loading}
            className="flex-1 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : 'Proceed to Payment'}
          </button>
        </div>
      </div>
    );
  };

  const renderDetails = () => {
    if (!catalog) return null;

    return (
      <>
        <div className="space-y-4">
          {cart.items.map((item) => {
            const catalogItem = catalog.items.find((i: SquareItem) => i.id === item.itemId);
            const variation = catalogItem?.variations.find((v: SquareVariation) => v.id === item.variationId);
            if (!variation?.price?.amount) return null;
            
            return (
              <div key={`${item.itemId}-${item.variationId}`} className="flex items-center justify-between border-b pb-4">
                <div>
                  <h3 className="font-semibold">{catalogItem?.name}</h3>
                  <p className="text-sm text-gray-500">{variation?.name}</p>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.itemId, item.variationId, item.quantity - 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      onClick={() => handleQuantityChange(item.itemId, item.variationId, item.quantity + 1)}
                      className="p-1 rounded-full hover:bg-gray-100"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </button>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(variation.price.amount * item.quantity)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Store Location</label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
            >
              {STORE_CONFIG.locations.map(location => (
                <option key={location.id} value={location.id}>
                  {location.name} - {location.address.formatted}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Fulfillment Method</label>
            <div className="flex space-x-4">
              <button
                type="button"
                onClick={() => handleFulfillmentTypeChange('pickup')}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  fulfillmentType === 'pickup'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pickup
              </button>
              <button
                type="button"
                onClick={() => handleFulfillmentTypeChange('delivery')}
                className={`flex-1 py-2 px-4 rounded-lg ${
                  fulfillmentType === 'delivery'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Delivery
              </button>
            </div>
          </div>

          {fulfillmentType === 'pickup' ? (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Pickup Details</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700">Pickup Time</label>
                <select
                  value={pickupTime}
                  onChange={(e) => setPickupTime(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                >
                  <option value="">Select a time slot</option>
                  {timeSlots.map(slot => (
                    <option key={slot.value} value={slot.value}>
                      {slot.label}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  Pickup will be tomorrow, {new Date(pickupDate).toLocaleDateString()}
                </p>
              </div>
            </div>
          ) : (
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Delivery Address</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Street Address</label>
                  <input
                    type="text"
                    value={deliveryAddress.addressLine1}
                    onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                    placeholder="123 Main St"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Apartment, suite, etc.</label>
                  <input
                    type="text"
                    value={deliveryAddress.addressLine2}
                    onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                    placeholder="Apt 4B"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700">City</label>
                    <input
                      type="text"
                      value={deliveryAddress.city}
                      onChange={(e) => handleAddressChange('city', e.target.value)}
                      placeholder="Los Angeles"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700">State</label>
                    <input
                      type="text"
                      value={deliveryAddress.state}
                      onChange={(e) => handleAddressChange('state', e.target.value)}
                      placeholder="CA"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                    />
                  </div>
                  <div className="col-span-1">
                    <label className="block text-sm font-medium text-gray-700">ZIP Code</label>
                    <input
                      type="text"
                      value={deliveryAddress.zip}
                      onChange={(e) => handleAddressChange('zip', e.target.value)}
                      placeholder="90015"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500"
                      maxLength={5}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between mb-2">
              <span>Subtotal:</span>
              <span className="font-semibold">{formatPrice(calculateSubtotal())}</span>
            </div>
            {fulfillmentType === 'delivery' && deliveryFeeName && (
              <div className="flex justify-between mb-2">
                <span>Delivery Fee:</span>
                <span className="font-semibold">{formatPrice(getDeliveryFeeAmount())}</span>
              </div>
            )}
            <div className="flex justify-between font-bold pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>{formatPrice(calculateTotal())}</span>
            </div>
          </div>

          <button
            onClick={handleProceedToSummary}
            disabled={loading || cart.items.length === 0 || 
              (fulfillmentType === 'delivery' && !deliveryFeeName) ||
              (fulfillmentType === 'pickup' && !pickupTime)}
            className="w-full mt-4 py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Review Order
          </button>
        </div>
      </>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-lg shadow-xl p-6"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900">Your Cart</h2>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600">{error}</p>
              </div>
            )}

            <div>
              {cart.items.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                step === 'details' ? renderDetails() : renderSummary()
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
