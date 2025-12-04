import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebaseConfig';

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
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={isLogin ? 'Login' : 'Sign Up'} onPress={handleAuth} />
      <Button title={`Switch to ${isLogin ? 'Sign Up' : 'Login'}`} onPress={() => setIsLogin(!isLogin)} />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      padding: 16,
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      textAlign: 'center',
      marginBottom: 24,
    },
    input: {
      height: 40,
      borderColor: 'gray',
      borderWidth: 1,
      borderRadius: 8,
      marginBottom: 12,
      paddingLeft: 8,
    },
  });

export default AuthScreen;
