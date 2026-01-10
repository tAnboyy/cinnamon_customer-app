import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, getAuth, browserLocalPersistence } from 'firebase/auth';
import { Platform } from 'react-native';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDGmSwh45pjjQqL0pwDln1N-Q0ZGouOv8k",
  authDomain: "cinnamon-live.firebaseapp.com",
  projectId: "cinnamon-live",
  storageBucket: "cinnamon-live.firebasestorage.app",
  messagingSenderId: "919849328876",
  appId: "1:919849328876:web:25f92c7d8718448d1305c9",
  measurementId: "G-RH89690RNL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Platform-specific auth initialization
let auth;
if (Platform.OS === 'web') {
  // On web, use the default getAuth which uses browser persistence
  auth = getAuth(app);
} else {
  // On native, use AsyncStorage persistence
  const ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
  });
}

export { auth };
