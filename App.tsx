import React, { useState, useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './src/redux/store';
import { View, Text } from 'react-native';
import { StripeProvider } from '@stripe/stripe-react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/firebaseConfig';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { Ionicons } from '@expo/vector-icons';

import MenuScreen from './src/screens/MenuScreen';
import CateringScreen from './src/screens/CateringScreen';
import CartScreen from './src/screens/CartScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FloatingCartSummary from './src/components/FloatingCartSummary';
import AuthScreen from './src/screens/AuthScreen';
import MealPlanScreen from './src/screens/MealPlanScreen';
import PaymentConfirmationScreen from './src/screens/PaymentConfirmationScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Header() {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        height: 56 + insets.top,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        elevation: 2,
        borderBottomColor: '#eee',
        borderBottomWidth: 1,
      }}
    >
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
    // Get the bottom tab bar height to offset the floating cart
    // Avoid overlap with the tab bar
    const tabBarHeight = 56; // default fallback
    return (
      <>
        <Header />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarIcon: ({ color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap = 'home';
              switch (route.name) {
                case 'Menu':
                  iconName = 'restaurant-outline';
                  break;
                case 'Catering':
                  iconName = 'call-outline';
                  break;
                case 'Meal Plans':
                  iconName = 'calendar-outline';
                  break;
                case 'Past Orders':
                  iconName = 'receipt-outline';
                  break;
                case 'Profile':
                  iconName = 'person-circle-outline';
                  break;
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#000',
            tabBarInactiveTintColor: '#666',
            tabBarStyle: { backgroundColor: '#fff' },
            tabBarLabelStyle: { fontSize: 12 },
          })}
        >
          <Tab.Screen name="Menu" component={MenuScreen} />
          <Tab.Screen name="Catering" component={CateringScreen} />
          <Tab.Screen name="Meal Plans" component={MealPlanScreen} />
          <Tab.Screen name="Past Orders" component={PlaceholderScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
        <FloatingCartSummary onPress={() => navigation.navigate('Cart')} extraBottom={tabBarHeight} />
      </>
    );
  }

function AppContent() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Configure Google Sign-In once at app startup
    GoogleSignin.configure({
      webClientId: '919849328876-05jlgu8kj4jn29jbgk89e804nn2nqig3.apps.googleusercontent.com',
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="dark" backgroundColor="#ffffff" />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="Main" component={MainTabs} />
            <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
            <Stack.Screen name="PaymentConfirmation" component={PaymentConfirmationScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function App() {
  return (
    <StripeProvider publishableKey="pk_test_51KDgksSIsoMtySehtjFkFY6kxKB1gy0XTvFTt5zT89OZ6tRTo5nWnxlvgkJkEW8ZISNwkTaalRymEZgaBNk6iATX00gbuMjqGs">
        <Provider store={store}>
            <SafeAreaProvider>
              <AppContent />
            </SafeAreaProvider>
        </Provider>
    </StripeProvider>
  );
}

export default registerRootComponent(App);
