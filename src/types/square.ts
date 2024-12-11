import { CatalogObject } from 'square';

export interface SquareItem {
  id: string;
  name: string;
  description?: string;
  variations: SquareVariation[];
  imageIds?: string[];
  category?: string;
}

export interface SquareVariation {
  id: string;
  name: string;
  price: Money;
  itemId: string;
  ordinal: number;
  available: boolean;
}

export interface Money {
  amount: number;
  currency: string;
}

export interface SquareImage {
  id: string;
  url: string;
}

export interface SquareCategory {
  id: string;
  name: string;
  ordinal: number;
}

export interface SquareCatalogResponse {
  items: SquareItem[];
  images: SquareImage[];
  categories: SquareCategory[];
}

// Cart and Order Types
export interface CartItem {
  itemId: string;
  variationId: string;
  quantity: number;
}

export type FulfillmentType = 'delivery' | 'pickup';

export interface CreateOrderRequest {
  cartItems: CartItem[];
  customerDetails: CustomerDetails;
  fulfillmentDetails: DeliveryDetails | PickupDetails;
  fulfillmentType: FulfillmentType;
  locationId: string;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface DeliveryDetails {
  address: {
    addressLine1: string;
    addressLine2?: string;
    locality: string;
    administrativeDistrictLevel1: string;
    postalCode: string;
  };
  deliveryInstructions?: string;
  preferredDate: string;
  preferredTimeSlot: string;
  distance?: number; // Distance in miles
  deliveryPrice?: number; // Price in cents
}

export interface PickupDetails {
  preferredDate: string;
  preferredTimeSlot: string;
  pickupInstructions?: string;
}

export interface CreatePaymentRequest {
  orderId: string;
  sourceId: string;
}

export interface OrderResponse {
  orderId: string;
  total: Money;
  status: string;
}

export interface StoreLocation {
  id: string;
  name: string;
  squareLocationId: string;
  address: {
    lat: number;
    lng: number;
    formatted: string;
  };
}

// Store configuration
export const STORE_CONFIG = {
  CHRISTMAS_TREES_CATEGORY_ID: 'IQ6T2GWVZQBH33LUA7NLBG46',
  DELIVERY_ITEM_PREFIX: 'DELIVERY-',
  locations: [
    {
      id: 'los-angeles',
      name: 'Los Angeles',
      squareLocationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID_LA || 'L5BQY108WBHK4',
      address: {
        lat: 34.044227,
        lng: -118.272217,
        formatted: "1360 S Figueroa St, Los Angeles, CA 90015"
      }
    },
    {
      id: 'altadena',
      name: 'Altadena',
      squareLocationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID_ALTADENA || 'LR7THQ45Q4P0V',
      address: {
        lat: 34.190141,
        lng: -118.158531,
        formatted: "2308 N. Lincoln Ave, Altadena, CA 91001"
      }
    }
  ],
  hours: {
    open: 9, // 9 AM
    close: 21, // 9 PM (updated to allow for 6-9 PM slot)
  },
  delivery: {
    maxRadius: 8, // 8 mile radius
    pricing: {
      base: 2900, // $29 base price
      maxPrice: 4000, // $40 max price
      pricePerMile: 137.5, // About $1.37 per mile to reach $40 at 8 miles
    }
  }
};

// Type guard functions
export function isValidCatalogItem(obj: CatalogObject): boolean {
  // Check if it's a delivery item
  const isDeliveryItem = obj.type === 'ITEM' && 
                        !!obj.itemData?.name?.startsWith(STORE_CONFIG.DELIVERY_ITEM_PREFIX);

  // Check for christmas-trees category
  const hasChristmasTreeCategory = !!(
    // Check in categories array
    obj.itemData?.categories?.some(cat => cat.id === STORE_CONFIG.CHRISTMAS_TREES_CATEGORY_ID) ||
    // Check in reporting category
    obj.itemData?.reportingCategory?.id === STORE_CONFIG.CHRISTMAS_TREES_CATEGORY_ID ||
    // Check in categoryId field
    obj.itemData?.categoryId === STORE_CONFIG.CHRISTMAS_TREES_CATEGORY_ID
  );

  const isValid = obj.type === 'ITEM' && 
                 !!obj.itemData?.name &&
                 Array.isArray(obj.itemData?.variations) &&
                 (hasChristmasTreeCategory || isDeliveryItem) &&
                 !obj.isDeleted;

  // Log validation details
  console.log(`Validating item ${obj.itemData?.name}:`, {
    isItem: obj.type === 'ITEM',
    hasName: !!obj.itemData?.name,
    hasVariations: Array.isArray(obj.itemData?.variations),
    categories: obj.itemData?.categories,
    reportingCategory: obj.itemData?.reportingCategory,
    categoryId: obj.itemData?.categoryId,
    hasChristmasTreeCategory,
    isDeliveryItem,
    isDeleted: obj.isDeleted,
    isValid
  });

  return isValid;
}

export function isValidCatalogImage(obj: CatalogObject): boolean {
  return obj.type === 'IMAGE' && 
         !!obj.imageData?.url;
}

export function isValidCatalogCategory(obj: CatalogObject): boolean {
  return obj.type === 'CATEGORY' && 
         !!obj.categoryData?.name;
}

// Helper type for null handling
export type Nullable<T> = T | null | undefined;

// Square API Money type
export interface SquareMoney {
  amount: bigint;
  currency: string;
}
