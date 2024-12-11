import { NextResponse } from 'next/server';
import { fetchCatalog } from '../../../utils/square';

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Verify environment variables are available
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      console.error('Missing required environment variable: SQUARE_ACCESS_TOKEN');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    console.log('Starting catalog fetch...');
    console.log('Environment check:', {
      env: process.env.NEXT_PUBLIC_SQUARE_ENV,
      hasToken: !!process.env.SQUARE_ACCESS_TOKEN,
      hasAppId: !!process.env.NEXT_PUBLIC_SQUARE_APP_ID,
      hasLocationId: !!process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
      nodeEnv: process.env.NODE_ENV
    });

    const catalog = await fetchCatalog();
    
    // Add detailed logging
    console.log('Catalog fetch details:', {
      itemCount: catalog.items.length,
      items: catalog.items.map(item => ({
        id: item.id,
        name: item.name,
        category: item.category,
        variations: item.variations.map(v => ({
          name: v.name,
          price: v.price,
          available: v.available
        })),
        hasImages: !!item.imageIds?.length
      })),
      imageCount: catalog.images.length,
      categoryCount: catalog.categories.length
    });

    if (catalog.items.length === 0) {
      console.log('No items found in catalog response. This might indicate a filtering issue.');
    }

    return NextResponse.json(catalog);
  } catch (error) {
    const errorMessage = error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      cause: error.cause
    } : 'Unknown error occurred';

    console.error('Detailed error in catalog fetch:', errorMessage);

    return NextResponse.json(
      { 
        error: 'Failed to fetch catalog',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
