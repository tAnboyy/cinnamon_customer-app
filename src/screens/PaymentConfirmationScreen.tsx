import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';

const PaymentConfirmationScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { amount, pickupDate, pickupTime, paymentMethod } = route.params || {};

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Order Placed Successfully! 🎉</Text>
      <Text style={styles.text}>Amount: ${Number(amount || 0).toFixed(2)}</Text>
      {paymentMethod === 'online' && (
        <Text style={styles.paymentStatus}>Payment: Paid Online ✓</Text>
      )}
      {paymentMethod === 'cash' && (
        <Text style={styles.paymentStatus}>Payment: Cash on Pickup</Text>
      )}
      {pickupDate && pickupTime && (
        <Text style={styles.text}>Pickup: {pickupDate} at {pickupTime}</Text>
      )}
      <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Main', { screen: 'Menu' })}>
        <Text style={styles.btnText}>Back to Menu</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: '700', color: '#000', marginBottom: 12, textAlign: 'center' },
  text: { fontSize: 16, color: '#000', marginBottom: 8, textAlign: 'center' },
  paymentStatus: { fontSize: 16, color: '#4caf50', marginBottom: 8, textAlign: 'center', fontWeight: '600' },
  btn: { marginTop: 16, height: 44, borderRadius: 8, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default PaymentConfirmationScreen;
