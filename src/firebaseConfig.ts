import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

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
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
