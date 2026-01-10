import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { signInWithGoogle } from '../services/googleAuth';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const getErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/user-disabled':
        return 'This account has been disabled';
      case 'auth/user-not-found':
        return 'No account found with this email';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/invalid-credential':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'An account already exists with this email';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      default:
        return 'An error occurred. Please try again';
    }
  };

  const handleAuth = () => {
    setError('');
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (isLogin) {
      signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          setError('');
        })
        .catch(error => {
          console.error('Login error:', error);
          setError(getErrorMessage(error.code));
        });
    } else {
      createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          setError('');
        })
        .catch(error => {
          console.error('Sign up error:', error);
          setError(getErrorMessage(error.code));
        });
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🍽️</Text>
          <Text style={styles.appName}>Cinnamon Live</Text>
        </View>
        
        <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Sign in to continue' : 'Sign up to get started'}
        </Text>
        
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError('');
        }}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError('');
        }}
        secureTextEntry
      />
      <TouchableOpacity style={styles.primaryButton} onPress={handleAuth}>
        <Text style={styles.primaryButtonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.secondaryButton} onPress={() => {
        setIsLogin(!isLogin);
        setError('');
      }}>
        <Text style={styles.secondaryButtonText}>
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </Text>
      </TouchableOpacity>
      
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>OR</Text>
        <View style={styles.divider} />
      </View>
      
      <TouchableOpacity
        style={styles.googleButton}
        onPress={async () => {
          setError('');
          try {
            const res = await signInWithGoogle();
          } catch (err: any) {
            console.error('Google Sign-In error:', err);
            setError(err?.message ?? 'Google sign-in failed');
          }
        }}
      >
        <Text style={styles.googleButtonText}>🔐 Continue with Google</Text>
      </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
    }),
  },
  formContainer: {
    width: '100%',
    maxWidth: 450,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    ...(Platform.OS === 'web' && {
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    }),
    ...Platform.select({
      native: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logo: {
    fontSize: 64,
    marginBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#fee',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#d32f2f',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  input: {
    height: 52,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  primaryButton: {
    height: 52,
    backgroundColor: '#000',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 24,
  },
  secondaryButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  googleButton: {
    height: 52,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  googleButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AuthScreen;