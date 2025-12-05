import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingCartSummaryProps {
  onPress: () => void;
  extraBottom?: number; // additional bottom offset (e.g., tab bar height)
}

const FloatingCartSummary: React.FC<FloatingCartSummaryProps> = ({ onPress, extraBottom = 0 }) => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const insets = useSafeAreaInsets();

  if (totalItems === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { bottom: Math.max(16, insets.bottom + 8 + extraBottom) },
      ]}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <Text style={styles.text}>{totalItems} items</Text>
      <Text style={styles.text}>Total: ${totalPrice.toFixed(2)}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  text: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FloatingCartSummary;
