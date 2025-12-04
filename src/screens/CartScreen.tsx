import React from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { updateQuantity, removeFromCart } from '../redux/cartSlice';
import { placeOrder } from '../services/api';
import { Alert } from 'react-native';

const CartScreen = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();

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
      <Text>{item.name}</Text>
      <Text>${item.price.toFixed(2)}</Text>
      <View style={styles.quantityContainer}>
        <Button title="-" onPress={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))} />
        <Text>{item.quantity}</Text>
        <Button title="+" onPress={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))} />
      </View>
      <Button title="Remove" onPress={() => dispatch(removeFromCart(item.id))} />
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text>Your cart is empty.</Text>}
      />
      <Button title="Checkout" onPress={handleCheckout} disabled={cartItems.length === 0} />
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
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
  });

export default CartScreen;
