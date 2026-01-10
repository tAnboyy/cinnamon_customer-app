import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';

const merchantId = Constants.expoConfig?.plugins?.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === '@stripe/stripe-react-native'
)?.[1].merchantIdentifier || '';

const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!merchantId) {
    console.warn('Stripe Merchant Identifier is not set in app configuration.');
}

if (!publishableKey) {
    console.error('EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY is not set! Stripe payments will not work.');
}

export default function ExpoStripeProvider( props: Omit<React.ComponentProps<typeof StripeProvider>, 'publishableKey' | 'merchantIdentifier'> ) {
  if (!publishableKey) {
    console.error('Cannot initialize StripeProvider: Missing publishable key');
    return <>{props.children}</>;
  }
  
  return (
    <StripeProvider 
    publishableKey={publishableKey}
    // merchantIdentifier={merchantId!}
    urlScheme={Linking.createURL('/')?.split(':')[0]}
    {...props} />
  );
}