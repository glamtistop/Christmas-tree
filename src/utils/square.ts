import { Client, Environment } from 'square';
import { 
  SquareCatalogResponse, 
  SquareItem, 
  SquareImage, 
  SquareCategory,
  isValidCatalogItem,
  isValidCatalogImage,
  isValidCatalogCategory,
  STORE_CONFIG,
  StoreLocation
} from '../types/square';

export { STORE_CONFIG };

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
  environment: process.env.NEXT_PUBLIC_SQUARE_ENV === 'production' 
    ? Environment.Production 
    : Environment.Sandbox
});

export async function fetchCatalog(): Promise<SquareCatalogResponse> {
  try {
    console.log('Initializing Square catalog fetch...');
    
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      throw new Error('SQUARE_ACCESS_TOKEN is not defined in environment variables');
    }
    
    const { result } = await squareClient.catalogApi.listCatalog(undefined, 'ITEM,IMAGE,CATEGORY');
    
    console.log('Raw Square response:', {
      hasResult: !!result,
      objectCount: result?.objects?.length || 0
    });

    if (!result?.objects) {
      throw new Error('No catalog objects found in Square response');
    }

    // Process items - filter for christmas-trees category only
    console.log('Processing catalog items...');
    const items: SquareItem[] = result.objects
      .filter(isValidCatalogItem)
      .map(item => {
        console.log(`Processing item: ${item.id} (${item.itemData?.name})`);
        return {
          id: item.id!,
          name: item.itemData!.name!,
          description: item.itemData!.description || undefined,
          variations: item.itemData!.variations!.map(variation => {
            // Consider a variation available if it's not deleted
            const available = !variation.isDeleted;

            console.log(`Processing variation for ${item.itemData?.name}:`, {
              variationId: variation.id,
              variationName: variation.itemVariationData?.name,
              price: variation.itemVariationData?.priceMoney,
              available
            });

            return {
              id: variation.id!,
              name: variation.itemVariationData?.name || '',
              price: {
                amount: Number(variation.itemVariationData?.priceMoney?.amount || 0),
                currency: variation.itemVariationData?.priceMoney?.currency || 'USD'
              },
              itemId: item.id!,
              ordinal: Number(variation.itemVariationData?.ordinal || 0),
              available
            };
          }),
          imageIds: item.itemData!.imageIds || undefined,
          category: item.itemData!.categoryId || undefined
        };
      });

    console.log('Processed items:', items.map(item => ({
      id: item.id,
      name: item.name,
      variationCount: item.variations.length,
      hasImages: !!item.imageIds?.length
    })));

    // Process images - only include images used by christmas tree items
    console.log('Processing catalog images...');
    const treeImageIds = new Set(items.flatMap(item => item.imageIds || []));
    const images: SquareImage[] = result.objects
      .filter(isValidCatalogImage)
      .filter(image => treeImageIds.has(image.id!))
      .map(image => ({
        id: image.id!,
        url: image.imageData!.url!
      }));

    console.log(`Processed ${images.length} images:`, images.map(img => ({
      id: img.id,
      url: img.url
    })));

    // Process categories - only include christmas-trees category
    console.log('Processing catalog categories...');
    const categories: SquareCategory[] = result.objects
      .filter(isValidCatalogCategory)
      .filter(category => category.id === STORE_CONFIG.CHRISTMAS_TREES_CATEGORY_ID)
      .map(category => ({
        id: category.id!,
        name: category.categoryData!.name!,
        ordinal: 0
      }));

    console.log(`Processed ${categories.length} categories:`, categories);

    const response: SquareCatalogResponse = {
      items,
      images,
      categories
    };

    console.log('Final catalog response:', {
      itemCount: response.items.length,
      imageCount: response.images.length,
      categoryCount: response.categories.length,
      items: response.items.map(item => item.name)
    });

    return response;

  } catch (error) {
    console.error('Error in fetchCatalog:', {
      error: error instanceof Error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : 'Unknown error type'
    });
    throw error;
  }
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount / 100); // Square amounts are in cents
}

export function getImageUrl(imageId: string, images: SquareImage[]): string | undefined {
  return images.find(img => img.id === imageId)?.url;
}

export function getCategoryName(categoryId: string | undefined, categories: SquareCategory[]): string | undefined {
  return categories.find(cat => cat.id === categoryId)?.name;
}

// Get store location by ID
export function getStoreLocation(locationId: string): StoreLocation | undefined {
  return STORE_CONFIG.locations.find(location => location.id === locationId);
}

// Calculate delivery fee based on distance tiers
export function calculateDeliveryFee(distanceInMiles: number): string | undefined {
  if (distanceInMiles > 8) {
    return undefined; // Outside delivery radius
  }

  // Delivery fee names for each distance tier
  const deliveryFees = {
    'under1': 'DELIVERY-UNDER-1',   // $20.00
    'mile1': 'DELIVERY-1-MILE',     // $22.50
    'mile2': 'DELIVERY-2-MILE',     // $25.00
    'mile3': 'DELIVERY-3-MILE',     // $27.50
    'mile4': 'DELIVERY-4-MILE',     // $30.00
    'mile5': 'DELIVERY-5-MILE',     // $32.50
    'mile6': 'DELIVERY-6-MILE',     // $35.00
    'mile7': 'DELIVERY-7-MILE',     // $37.50
    'mile8': 'DELIVERY-8-MILE'      // $40.00
  };

  // Select appropriate fee based on distance
  if (distanceInMiles <= 1) return deliveryFees.under1;
  if (distanceInMiles <= 2) return deliveryFees.mile1;
  if (distanceInMiles <= 3) return deliveryFees.mile2;
  if (distanceInMiles <= 4) return deliveryFees.mile3;
  if (distanceInMiles <= 5) return deliveryFees.mile4;
  if (distanceInMiles <= 6) return deliveryFees.mile5;
  if (distanceInMiles <= 7) return deliveryFees.mile6;
  if (distanceInMiles <= 8) return deliveryFees.mile7;
  return deliveryFees.mile8;
}

// Calculate delivery distance from specific store location
export function calculateDeliveryDistanceFromStore(
  locationId: string,
  customerLat: number,
  customerLng: number
): number {
  const location = getStoreLocation(locationId);
  if (!location) return Infinity;
  
  return calculateDistance(
    location.address.lat,
    location.address.lng,
    customerLat,
    customerLng
  );
}

// Function to calculate distance between two points using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return Math.round(R * c * 10) / 10; // Round to 1 decimal place
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export function getNextDayDate(): string {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export function getDeliveryTimeSlots(): { value: string; label: string }[] {
  const { open, close } = STORE_CONFIG.hours;
  const slots = [];

  // Create 3-hour time slots
  for (let hour = open; hour <= close - 3; hour += 3) {
    const startTime = hour.toString().padStart(2, '0') + ':00';
    
    // Convert to 12-hour format for display
    const startHour = hour % 12 || 12;
    const endHour = (hour + 3) % 12 || 12;
    const startPeriod = hour < 12 ? 'AM' : 'PM';
    const endPeriod = (hour + 3) < 12 ? 'AM' : 'PM';

    slots.push({
      value: startTime,
      label: `${startHour}:00 ${startPeriod} - ${endHour}:00 ${endPeriod}`
    });
  }

  return slots;
}
