import { NextResponse } from 'next/server';
import { Client, Environment, CreatePaymentLinkRequest } from 'square';
import { CartItem } from '@/types/square';

const squareClient = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN || '',
  environment: process.env.NEXT_PUBLIC_SQUARE_ENV === 'production' 
    ? Environment.Production 
    : Environment.Sandbox
});

interface CheckoutRequest {
  cartItems: CartItem[];
  locationId: string;
  fulfillmentType: 'pickup' | 'delivery';
  pickupDate?: string;
  pickupTime?: string;
  deliveryAddress?: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
}

export async function POST(request: Request) {
  try {
    // Verify environment variables are available
    if (!process.env.SQUARE_ACCESS_TOKEN || !process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID) {
      console.error('Missing required environment variables');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const body = await request.json() as CheckoutRequest;
    console.log('Received request body:', body);

    // Create a unique idempotency key for this checkout
    const idempotencyKey = `${Date.now()}-${Math.random().toString(36).substr(2, 8)}`;

    // Create the checkout request
    const checkoutRequest: CreatePaymentLinkRequest = {
      idempotencyKey,
      order: {
        locationId: process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID,
        lineItems: body.cartItems.map(item => ({
          quantity: item.quantity.toString(),
          catalogObjectId: item.variationId
        }))
      },
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/order-confirmation`
      }
    };

    console.log('Creating checkout with request:', checkoutRequest);

    const { result } = await squareClient.checkoutApi.createPaymentLink(checkoutRequest);
    console.log('Checkout created:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error in checkout:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout' },
      { status: 500 }
    );
  }
}
