import React from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { updateQuantity, removeFromCart } from '../redux/cartSlice';
import { placeOrder } from '../services/api';
import { Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const CartScreen = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();

  const handleCheckout = () => {
    // In a real app, you'd get the userId from your auth state
    const order = {
      items: cartItems,
      userId: 'test-user-id', 
      paymentIntentId: 'pi_test_stripe_id' // This would come from Stripe
    };

    placeOrder(order)
      .then(response => {
        Alert.alert('Order Placed!', response.data);
      })
      .catch(error => {
        console.error(error);
        Alert.alert('Error', 'Could not place order.');
      });
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Text style={{ color: '#000000ff' }}>{item.name}</Text>
      <Text>${item.price.toFixed(2)}</Text>
      <View style={styles.quantityContainer}>
        <TouchableOpacity style={styles.qtyButton} onPress={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}>
          <Text style={styles.qtyButtonText}>-</Text>
        </TouchableOpacity>
        <Text style={{ color: '#000000ff' }}>{item.quantity}</Text>
        <TouchableOpacity style={styles.qtyButton} onPress={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}>
          <Text style={styles.qtyButtonText}>+</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity onPress={() => dispatch(removeFromCart(item.id))}>
        <Text style={{ color: '#d32f2f' }}>Remove</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text>Your cart is empty.</Text>}
        contentContainerStyle={{ paddingBottom: 96 }}
      />
      <View style={[styles.footer, { paddingBottom: Math.max(16, insets.bottom + 8) }]}>
        <TouchableOpacity
          style={[styles.checkoutButton, cartItems.length === 0 && { opacity: 0.5 }]}
          onPress={handleCheckout}
          disabled={cartItems.length === 0}
          activeOpacity={0.8}
        >
          <Text style={styles.checkoutText}>Checkout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: '#fff',
    },
    itemContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    quantityContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    qtyButton: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#f2f2f2',
      justifyContent: 'center',
      alignItems: 'center',
      marginHorizontal: 8,
    },
    qtyButtonText: {
      color: '#000',
      fontSize: 18,
      fontWeight: '600',
    },
    footer: {
      position: 'absolute',
      left: 16,
      right: 16,
      bottom: 0,
      backgroundColor: 'transparent',
    },
    checkoutButton: {
      height: 48,
      borderRadius: 8,
      backgroundColor: '#ffd723ff',
      justifyContent: 'center',
      alignItems: 'center',
      elevation: 2,
    },
    checkoutText: {
      color: '#000',
      fontSize: 16,
      fontWeight: '500',
    },
  });

export default CartScreen;
