import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Use a test publishable key if environment variable is not set
const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_51QaZqtP6sL33Y5pDg5K3jJpmFW8YvJLDXZVqrKhCx1KcJ8jEW2VSaJQOAg0G5SBhAGbdckqJqOQP2iCt0bPKQJHW00P8pTYVqX';

if (!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
  console.warn('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set! Using fallback test key.');
}

const stripePromise = loadStripe(publishableKey);

export default function ExpoStripeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
}
