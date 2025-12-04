import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './src/redux/store';
import { View, Text } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/firebaseConfig';

import MenuScreen from './src/screens/MenuScreen';
import CateringScreen from './src/screens/CateringScreen';
import CartScreen from './src/screens/CartScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import FloatingCartSummary from './src/components/FloatingCartSummary';
import AuthScreen from './src/screens/AuthScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Header() {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, backgroundColor: '#fff', elevation: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', flex: 1 }}>Cinnamon Live</Text>
      <Text>🔔</Text>
      <View>
        <Text style={{ marginLeft: 12 }}>🛒</Text>
        {totalItems > 0 && (
          <View style={{ position: 'absolute', right: -8, top: -8, backgroundColor: 'red', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: 'white', fontSize: 12 }}>{totalItems}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function MainTabs({ navigation }: any) {
    return (
      <>
        <Header />
        <Tab.Navigator>
          <Tab.Screen name="Menu" component={MenuScreen} />
          <Tab.Screen name="Catering" component={CateringScreen} />
          <Tab.Screen name="Meal Plans" component={PlaceholderScreen} />
          <Tab.Screen name="Past Orders" component={PlaceholderScreen} />
          <Tab.Screen name="Profile" component={PlaceholderScreen} />
        </Tab.Navigator>
        <FloatingCartSummary onPress={() => navigation.navigate('Cart')} />
      </>
    );
  }

function AppContent() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: true }} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <StripeProvider publishableKey="pk_test_51KDgksSIsoMtySehtjFkFY6kxKB1gy0XTvFTt5zT89OZ6tRTo5nWnxlvgkJkEW8ZISNwkTaalRymEZgaBNk6iATX00gbuMjqGs">
        <Provider store={store}>
            <AppContent />
        </Provider>
    </StripeProvider>
  );
}
