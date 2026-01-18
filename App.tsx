import React, { useState, useEffect } from 'react';
import { registerRootComponent } from 'expo';
import { NavigationContainer, useNavigation } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Provider, useSelector } from 'react-redux';
import { store, RootState } from './src/redux/store';
import { View, Text, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './src/firebaseConfig';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';

import MenuScreen from './src/screens/MenuScreen';
import CateringScreen from './src/screens/CateringScreen';
import CartScreen from './src/screens/CartScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import PastOrdersScreen from './src/screens/PastOrdersScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import FloatingCartSummary from './src/components/FloatingCartSummary';
import AuthScreen from './src/screens/AuthScreen';
import MealPlanScreen from './src/screens/MealPlanScreen';
import PaymentConfirmationScreen from './src/screens/PaymentConfirmationScreen';

import ExpoStripeProvider from 'src/components/stripe-provider';

console.log('App.tsx loaded');

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Header() {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItems = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingBottom: 0,
        height: 64 + insets.top,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Platform.OS === 'web' ? 32 : 16,
        backgroundColor: '#fff',
        maxWidth: Platform.OS === 'web' ? 1200 : undefined,
        width: '100%',
        alignSelf: 'center',
        ...(Platform.OS === 'web' && {
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }),
        ...Platform.select({
          native: {
            elevation: 2,
            borderBottomColor: '#eee',
            borderBottomWidth: 1,
          },
        }),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
        <Text style={{ fontSize: 24, marginRight: 8 }}>🍽️</Text>
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#1a1a1a' }}>Cinnamon Live</Text>
      </View>
      <TouchableOpacity 
        onPress={() => navigation.navigate('Cart')} 
        style={{ padding: 10, position: 'relative' }} 
        accessibilityRole="button" 
        accessibilityLabel="Open cart"
      >
        <Text style={{ fontSize: 24 }}>🛒</Text>
        {totalItems > 0 && (
          <View style={{ 
            position: 'absolute', 
            right: 0, 
            top: 0, 
            backgroundColor: '#d32f2f', 
            borderRadius: 12, 
            minWidth: 24, 
            height: 24, 
            justifyContent: 'center', 
            alignItems: 'center',
            paddingHorizontal: 6,
          }}>
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '700' }}>{totalItems}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

function MainTabs({ navigation }: any) {
    // Get the bottom tab bar height to offset the floating cart
    // Avoid overlap with the tab bar
    const insets = useSafeAreaInsets();
    const tabBarHeight = Platform.OS === 'web' ? 64 : 56;
    return (
      <>
        <Header />
        <Tab.Navigator
          screenOptions={({ route, navigation }) => ({
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
            tabBarActiveTintColor: '#1a1a1a',
            tabBarInactiveTintColor: '#9e9e9e',
            tabBarStyle: { 
              backgroundColor: '#fff', 
              borderTopWidth: 1, 
              borderTopColor: '#e0e0e0',
              height: Platform.OS === 'web' ? 64 : 56,
              paddingBottom: Platform.OS === 'web' ? insets.bottom : 4,
              paddingTop: 0,
              position: 'relative',
              ...(Platform.OS === 'web' && {
                boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.1)',
              }),
            },
            tabBarLabelStyle: ({ focused }: { focused: boolean }) => ({ 
              fontSize: 12, 
              fontWeight: '600',
              marginTop: 2,
              // marginBottom: Platform.OS === 'web' ? 4 : 0,
            }),
            tabBarItemStyle: Platform.OS === 'web' ? {
              height: 'auto',
            } : undefined,
          })}
        >
          <Tab.Screen name="Menu" component={MenuScreen} />
          <Tab.Screen name="Catering" component={CateringScreen} />
          <Tab.Screen name="Meal Plans" component={MealPlanScreen} />
          <Tab.Screen name="Past Orders" component={PastOrdersScreen} />
          <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
        <FloatingCartSummary onPress={() => navigation.navigate('Cart')} extraBottom={tabBarHeight} />
      </>
    );
  }

function AppContent() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Configure Google Sign-In only on native platforms
    if (Platform.OS !== 'web') {
      const { GoogleSignin } = require('@react-native-google-signin/google-signin');
      GoogleSignin.configure({
        webClientId: '919849328876-05jlgu8kj4jn29jbgk89e804nn2nqig3.apps.googleusercontent.com',
      });
    }

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
console.log('App component rendering');
  
function App() {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    async function loadFonts() {
      try {
        // Load Ionicons font file directly
        await Font.loadAsync({
          'Ionicons': require('@expo/vector-icons/build/vendor/react-native-vector-icons/Fonts/Ionicons.ttf'),
        });
        setFontsLoaded(true);
        console.log('Fonts loaded successfully');
      } catch (error) {
        console.error('Error loading fonts:', error);
        // Still set to true to allow app to render
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  useEffect(() => {
    // Enable scrollbar on web
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const style = document.createElement('style');
      style.textContent = `
        html, body, #root {
          overflow-y: auto !important;
          overflow-x: hidden;
          -webkit-overflow-scrolling: touch;
        }
        * {
          scrollbar-width: auto;
          scrollbar-color: #888 #f1f1f1;
        }
        *::-webkit-scrollbar {
          width: 12px;
        }
        *::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        *::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 6px;
        }
        *::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `;
      document.head.appendChild(style);
      return () => {
        document.head.removeChild(style);
      };
    }
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator size="large" color="#1a1a1a" />
      </View>
    );
  }

  return (
    <ExpoStripeProvider>
        <Provider store={store}>
            <SafeAreaProvider>
              <AppContent />
            </SafeAreaProvider>
        </Provider>
    </ExpoStripeProvider>
  );
}

export default App;
