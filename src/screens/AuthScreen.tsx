import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';
import { signInWithGoogle } from '../services/googleAuth';

const AuthScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);

  const handleAuth = () => {
    if (isLogin) {
      signInWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          // Signed in 
          const user = userCredential.user;
          Alert.alert('Logged in!', `Welcome ${user.email}`);
        })
        .catch(error => {
          Alert.alert('Login Error', error.message);
        });
    } else {
      createUserWithEmailAndPassword(auth, email, password)
        .then(userCredential => {
          // Signed up 
          const user = userCredential.user;
          Alert.alert('Signed up!', `Welcome ${user.email}`);
        })
        .catch(error => {
          Alert.alert('Sign Up Error', error.message);
        });
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Login' : 'Sign Up'}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={isLogin ? 'Login' : 'Sign Up'} onPress={handleAuth} />
      <Button title={`Switch to ${isLogin ? 'Sign Up' : 'Login'}`} onPress={() => setIsLogin(!isLogin)} />
      <View style={{ height: 16 }} />
      <Button
        title="Continue with Google"
        onPress={async () => {
          try {
            const res = await signInWithGoogle();
            Alert.alert('Logged in!', `Welcome ${res.email ?? res.userId}`);
          } catch (err: any) {
            Alert.alert('Google Sign-In Error', err?.message ?? 'Unknown error');
          }
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 16,
      backgroundColor: '#fff',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 24,
      color: '#000',
    },
    input: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 12,
      paddingLeft: 8,
      color: '#000',
    },
  });

export default AuthScreen;
