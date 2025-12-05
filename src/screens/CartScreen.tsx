import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
// Using lightweight custom pickers to avoid extra dependencies
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { updateQuantity, removeFromCart, clearCart } from '../redux/cartSlice';
import { placeOrder, createPaymentIntent } from '../services/api';
import { Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const CartScreen = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();

  const [pickupDate, setPickupDate] = useState(''); // e.g., 2025-12-05
  const [pickupTime, setPickupTime] = useState(''); // e.g., 18:30
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);
    const [dateValue, setDateValue] = useState<Date>(new Date());
    const [timeValue, setTimeValue] = useState<Date>(new Date());

    const formatDate = (d: Date) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const formatTime = (d: Date) => {
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${hh}:${mm}`;
    };
  const [contactNumber, setContactNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('cash');
  const [confirmCashModal, setConfirmCashModal] = useState(false);
  const totalAmount = useMemo(() => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0), [cartItems]);

  const submitOrder = async (paymentIntentId?: string) => {
    const order = {
      items: cartItems,
      userId: 'test-user-id',
      contactNumber,
      notes,
      paymentMethod,
      paymentIntentId: paymentIntentId || null,
      totalAmount,
      pickupDate,
      pickupTime,
    };
    try {
      const response = await placeOrder(order as any);
      // Success: clear cart and navigate back to Menu tab
      dispatch(clearCart());
      Alert.alert('Order Placed!', 'Your order has been placed successfully.');
      // Navigate to Main tabs -> Menu
      try {
        navigation.navigate('Main', { screen: 'Menu' });
      } catch {
        // Fallback: navigate to Cart's parent then Menu
        navigation.navigate('Main');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Could not place order.');
    }
  };

  const handleCheckout = async () => {
    if (!pickupDate || !pickupTime || !contactNumber) {
      Alert.alert('Missing Info', 'Please fill pickup date, time, and contact number.');
      return;
    }
    if (paymentMethod === 'online') {
      try {
        const amountCents = Math.round(totalAmount * 100);
        const resp = await createPaymentIntent(amountCents);
        const piId = resp.data?.id || resp.data?.paymentIntentId;
        // Here you would redirect to Stripe payment flow.
        // For now, assume success and submit order with payment intent.
        await submitOrder(piId);
      } catch (e) {
        console.error(e);
        Alert.alert('Payment Error', 'Failed to initiate online payment.');
      }
    } else {
      setConfirmCashModal(true);
    }
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
    <SafeAreaView style={styles.container}>
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={<Text>Your cart is empty.</Text>}
        contentContainerStyle={{ paddingBottom: 96 }}
      />
      {/* Order details */}
      <View style={styles.form}>
        <Text style={styles.formLabel}>Pickup Date</Text>
        <TouchableOpacity
          style={[styles.input, styles.inputButton]}
          onPress={() => setShowDatePicker(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.inputButtonText}>{pickupDate || 'Select date'}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display={Platform.OS === 'ios' ? 'inline' : 'default'}
            onChange={(event: any, selectedDate?: Date) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                setDateValue(selectedDate);
                setPickupDate(formatDate(selectedDate));
              }
              if (Platform.OS === 'android') setShowDatePicker(false);
            }}
          />
        )}

        <Text style={styles.formLabel}>Pickup Time</Text>
        <TouchableOpacity
          style={[styles.input, styles.inputButton]}
          onPress={() => setShowTimePicker(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.inputButtonText}>{pickupTime || 'Select time'}</Text>
        </TouchableOpacity>
        {showTimePicker && (
          <DateTimePicker
            value={timeValue}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event: any, selectedTime?: Date) => {
              setShowTimePicker(Platform.OS === 'ios');
              if (selectedTime) {
                setTimeValue(selectedTime);
                setPickupTime(formatTime(selectedTime));
              }
              if (Platform.OS === 'android') setShowTimePicker(false);
            }}
          />
        )}
        <Text style={styles.formLabel}>Contact Number</Text>
        <TextInput
          placeholder="e.g., 9842429243"
          keyboardType="phone-pad"
          placeholderTextColor="#999"
          style={styles.input}
          value={contactNumber}
          onChangeText={setContactNumber}
        />
        <Text style={styles.formLabel}>Notes (allergies/preferences)</Text>
        <TextInput
          placeholder="Any special instructions"
          placeholderTextColor="#999"
          style={[styles.input, { height: 80 }]}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
        <Text style={styles.formLabel}>Payment Method</Text>
        <View style={styles.paymentRow}>
          <TouchableOpacity
            style={[styles.paymentButton, paymentMethod === 'cash' && styles.paymentSelected]}
            onPress={() => setPaymentMethod('cash')}
          >
            <Text style={styles.paymentText}>Cash</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.paymentButton, paymentMethod === 'online' && styles.paymentSelected]}
            onPress={() => setPaymentMethod('online')}
          >
            <Text style={styles.paymentText}>Online</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.totalText}>Total: ${totalAmount.toFixed(2)}</Text>
      </View>
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
      <Modal visible={confirmCashModal} transparent animationType="fade" onRequestClose={() => setConfirmCashModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Confirm Cash Order</Text>
            <Text style={styles.modalText}>You will pay at pickup. Proceed?</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#f2f2f2' }]} onPress={() => setConfirmCashModal(false)}>
                <Text style={[styles.modalBtnText, { color: '#000' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, { backgroundColor: '#000' }]}
                onPress={async () => {
                  setConfirmCashModal(false);
                  await submitOrder();
                }}
              >
                <Text style={[styles.modalBtnText, { color: '#fff' }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 16,
      backgroundColor: '#fff',
    },
    form: {
      marginTop: 8,
      paddingVertical: 8,
      borderTopWidth: 1,
      borderTopColor: '#eee',
    },
    formLabel: {
      color: '#000',
      fontSize: 14,
      fontWeight: '600',
      marginTop: 8,
    },
    input: {
      borderWidth: 1,
      borderColor: '#ddd',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      color: '#000',
      marginTop: 6,
    },
    inputButton: {
      justifyContent: 'center',
    },
    inputButtonText: {
      color: '#000',
      fontSize: 14,
    },
    paymentRow: {
      flexDirection: 'row',
      gap: 10,
      marginTop: 8,
      alignItems: 'center',
    },
    paymentButton: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#ccc',
      backgroundColor: '#f7f7f7',
    },
    paymentSelected: {
      borderColor: '#000',
      backgroundColor: '#eaeaea',
    },
    paymentText: {
      color: '#000',
      fontWeight: '600',
    },
    totalText: {
      marginTop: 12,
      color: '#000',
      fontSize: 16,
      fontWeight: '700',
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
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.4)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    modalCard: {
      width: '100%',
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 16,
      elevation: 3,
    },
    modalTitle: {
      color: '#000',
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 6,
    },
    modalText: {
      color: '#000',
      fontSize: 14,
      marginBottom: 12,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    optionRow: {
      paddingVertical: 10,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    optionText: {
      color: '#000',
      fontSize: 14,
    },
    modalBtn: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 8,
    },
    modalBtnText: {
      fontWeight: '700',
    },
  });

export default CartScreen;
