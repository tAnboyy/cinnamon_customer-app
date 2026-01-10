import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, Platform, ScrollView } from 'react-native';
import * as Linking from 'expo-linking';
import { useStripe } from '@stripe/stripe-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
// Using lightweight custom pickers to avoid extra dependencies
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { updateQuantity, removeFromCart, clearCart } from '../redux/cartSlice';
import { placeOrder, createPaymentIntent, getPaymentSheetParams, fetchPaymentSheetParams } from '../services/api';
import { auth } from '../firebaseConfig';
import { Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';

const STORAGE_KEYS = {
  DEFAULT_CONTACT: 'user_default_contact_number',
  DEFAULT_NOTES: 'user_default_notes',
};

// async function fetchPaymentSheetParams(amount: number): Promise<{
//   paymentIntent: string;
//   ephemeralKey: string;
//   customer: string;
// }> {
//   return fetch(`/api/payment-sheet`, {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//     },
//     body: JSON.stringify({ amount }),
//   }).then(res => res.json());
// }

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
  const [orderDetailsModal, setOrderDetailsModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSheetReady, setPaymentSheetReady] = useState(false);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const totalAmount = useMemo(
    () => cartItems.reduce((sum, i) => sum + (typeof i.price === 'number' ? i.price * i.quantity : 0), 0),
    [cartItems]
  );

  // Load default contact number and notes from AsyncStorage on mount
  useEffect(() => {
    loadDefaults();
  }, []);

  const loadDefaults = async () => {
    try {
      const [defaultContact, defaultNotes] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_CONTACT),
        AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_NOTES),
      ]);
      
      if (defaultContact && !contactNumber) {
        setContactNumber(defaultContact);
        console.log('[CartScreen] Loaded default contact:', defaultContact);
      }
      
      if (defaultNotes && !notes) {
        setNotes(defaultNotes);
        console.log('[CartScreen] Loaded default notes:', defaultNotes);
      }
    } catch (error) {
      console.error('[CartScreen] Failed to load defaults:', error);
    }
  };

  const submitOrder = async (paymentIntentId?: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      console.error('[CartScreen] Cannot place order: no authenticated user');
      Alert.alert('Not signed in', 'Please sign in to place an order.');
      return;
    }
    const order = {
      items: cartItems,
      userId,
      contactNumber,
      notes,
      paymentMethod,
      paymentIntentId: paymentIntentId || null,
      totalAmount,
      pickupDate,
      pickupTime,
    };
    try {
      console.log('[CartScreen] Placing order userId=', userId, 'items=', cartItems.length, 'total=', totalAmount);
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
      console.error('[CartScreen] Place order failed', (error as any)?.message || error);
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
        setIsProcessing(true);
        const amountCents = Math.round(totalAmount * 100);
        // Try to reuse an existing customerId if available
        let customerId = await AsyncStorage.getItem('stripe_customer_id');
        
        // Get the current user's email from Firebase Auth
        const userEmail = auth.currentUser?.email || '';
        console.log('[CartScreen] Using email for payment:', userEmail);
        
        const sheetResp = await getPaymentSheetParams(amountCents, userEmail, customerId || undefined);

        console.log('[CartScreen] Payment sheet response:', {
          hasError: !!sheetResp?.error,
          hasPaymentIntent: !!sheetResp?.paymentIntent,
          hasEphemeralKey: !!sheetResp?.ephemeralKey,
          hasCustomer: !!sheetResp?.customer,
        });
        
        if (sheetResp?.error) {
          console.error('[CartScreen] Backend error:', sheetResp.error);
          // If customer error, clear the stored customer ID
          if (sheetResp.error.includes('customer')) {
            console.log('[CartScreen] Clearing invalid customer ID');
            await AsyncStorage.removeItem('stripe_customer_id');
          }
          Alert.alert('Payment Error', sheetResp.error);
          setIsProcessing(false);
          return;
        }
        
        const { paymentIntent, ephemeralKey, customer } = sheetResp;
        
        if (!paymentIntent) {
          console.error('[CartScreen] Missing payment intent client secret');
          Alert.alert('Payment Error', 'Failed to initialize payment');
          setIsProcessing(false);
          return;
        }
        
        // Persist customerId for reuse
        if (customer && customer !== customerId) {
          await AsyncStorage.setItem('stripe_customer_id', customer);
          customerId = customer;
        }

        console.log('[CartScreen] Initializing payment sheet with:', {
          merchantDisplayName: 'Cinnamon Live',
          paymentIntentClientSecret: paymentIntent?.substring(0, 20) + '...',
          hasCustomer: !!customer,
          hasEphemeralKey: !!ephemeralKey,
        });

        // Initialize with full customer details for better payment experience
        const init = await initPaymentSheet({
          merchantDisplayName: 'Cinnamon Live',
          customerId: customer,
          customerEphemeralKeySecret: ephemeralKey,
          paymentIntentClientSecret: paymentIntent, // This is already the client secret string from backend
          allowsDelayedPaymentMethods: true,
        });
        if (init.error) {
          console.error('[CartScreen] Init error:', init.error);
          Alert.alert('Payment Error', init.error.message || 'Failed to init payment sheet.');
          setIsProcessing(false);
          return;
        }

        console.log('[CartScreen] Payment sheet initialized successfully');
        setPaymentSheetReady(true);

        console.log('[CartScreen] Payment sheet initialized, presenting...');
        const present = await presentPaymentSheet();
        if (present.error) {
          console.error('[CartScreen] Payment sheet presentation error:', {
            message: present.error.message,
            code: present.error.code,
            type: present.error.type,
            declineCode: present.error.declineCode,
            localizedMessage: present.error.localizedMessage,
            stripeErrorCode: present.error.stripeErrorCode,
          });
          
          console.error('[CartScreen] Full error object:', JSON.stringify(present.error, null, 2));
          
          // Get more details from the error
          let errorDetails = present.error.message || 'Payment failed';
          if (present.error.declineCode) {
            errorDetails += `\n\nDecline Code: ${present.error.declineCode}`;
          }
          if (present.error.stripeErrorCode) {
            errorDetails += `\n\nStripe Error: ${present.error.stripeErrorCode}`;
          }
          if (present.error.localizedMessage && present.error.localizedMessage !== present.error.message) {
            errorDetails += `\n\n${present.error.localizedMessage}`;
          }
          
          Alert.alert('Payment Error', errorDetails);
        } else {
          console.log('[CartScreen] Payment succeeded!');
          // Payment succeeded, navigate to confirmation and submit order
          try {
            navigation.navigate('PaymentConfirmation', { amount: totalAmount, pickupDate, pickupTime });
          } catch (navErr) {
            console.error('[CartScreen] Navigation error:', navErr);
          }
          await submitOrder();
        }
      } catch (e) {
        console.error('[CartScreen] Exception:', e);
        Alert.alert('Payment Error', (e as any)?.message || 'Failed to initiate online payment.');
      } finally {
        setIsProcessing(false);
      }
    } else {
      setConfirmCashModal(true);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>
          ${typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}
        </Text>
      </View>
      <View style={styles.itemActions}>
        <View style={styles.quantityContainer}>
          <TouchableOpacity 
            style={styles.qtyButton} 
            onPress={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity - 1 }))}
          >
            <Text style={styles.qtyButtonText}>−</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{item.quantity}</Text>
          <TouchableOpacity 
            style={styles.qtyButton} 
            onPress={() => dispatch(updateQuantity({ id: item.id, quantity: item.quantity + 1 }))}
          >
            <Text style={styles.qtyButtonText}>+</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.itemTotal}>
          ${typeof item.price === 'number' ? (item.price * item.quantity).toFixed(2) : '0.00'}
        </Text>
        <TouchableOpacity 
          onPress={() => dispatch(removeFromCart(item.id))}
          style={styles.removeButton}
        >
          <Text style={styles.removeText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const hasAllRequiredInfo = pickupDate && pickupTime && contactNumber;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Your Cart</Text>
        <Text style={styles.itemCount}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Text>
      </View>

      {/* Cart Items List */}
      <FlatList
        data={cartItems}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>🛒</Text>
            <Text style={styles.emptyMessage}>Your cart is empty</Text>
            <Text style={styles.emptySubtext}>Add items from the menu to get started</Text>
          </View>
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* Compact Order Details Summary */}
      {cartItems.length > 0 && (
        <View style={styles.detailsSection}>
          <TouchableOpacity 
            style={styles.detailsSummary}
            onPress={() => setOrderDetailsModal(true)}
            activeOpacity={0.7}
          >
            <View style={styles.detailsRow}>
              <Text style={styles.detailsLabel}>Order Details</Text>
              {!hasAllRequiredInfo && (
                <View style={styles.warningBadge}>
                  <Text style={styles.warningText}>!</Text>
                </View>
              )}
            </View>
            
            {hasAllRequiredInfo ? (
              <View style={styles.summaryContent}>
                <Text style={styles.summaryText}>📅 {pickupDate} at {pickupTime}</Text>
                <Text style={styles.summaryText}>📞 {contactNumber}</Text>
                <Text style={styles.summaryText}>
                  💳 {paymentMethod === 'online' ? 'Online Payment' : 'Cash at Pickup'}
                </Text>
                {notes && <Text style={styles.summaryText} numberOfLines={1}>📝 {notes}</Text>}
              </View>
            ) : (
              <Text style={styles.incompleteText}>Tap to add pickup details</Text>
            )}
            
            <Text style={styles.editLink}>Edit Details →</Text>
          </TouchableOpacity>

          {/* Total and Checkout */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.checkoutButton, (!hasAllRequiredInfo || isProcessing) && styles.checkoutDisabled]}
              onPress={handleCheckout}
              disabled={!hasAllRequiredInfo || isProcessing}
              activeOpacity={0.8}
            >
              <Text style={styles.checkoutText}>
                {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Order Details Modal */}
      <Modal 
        visible={orderDetailsModal} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setOrderDetailsModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.orderDetailsModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Details</Text>
              <TouchableOpacity onPress={() => setOrderDetailsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Text style={styles.modalFormLabel}>Pickup Date *</Text>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => setShowDatePicker(prev => !prev)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalInputText}>{pickupDate || 'Select date'}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={dateValue}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'inline' : 'default'}
                  minimumDate={new Date()}
                  onChange={(event: any, selectedDate?: Date) => {
                    if (Platform.OS === 'ios') setShowDatePicker(false);
                    if (Platform.OS === 'android') setShowDatePicker(false);
                    if (selectedDate) {
                      const today = new Date();
                      const sel = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
                      const min = new Date(today.getFullYear(), today.getMonth(), today.getDate());
                      if (sel < min) return;
                      
                      setDateValue(selectedDate);
                      setPickupDate(formatDate(selectedDate));
                      
                      if (pickupTime) {
                        const [hh, mm] = pickupTime.split(':').map(n => parseInt(n, 10));
                        const selectedTimeDate = new Date(selectedDate);
                        selectedTimeDate.setHours(hh, mm, 0, 0);
                        const now = new Date();
                        const sameDay = sel.getTime() === min.getTime();
                        if (sameDay && selectedTimeDate < now) {
                          setPickupTime('');
                        }
                      }
                    }
                  }}
                />
              )}

              <Text style={styles.modalFormLabel}>Pickup Time *</Text>
              <TouchableOpacity
                style={styles.modalInput}
                onPress={() => setShowTimePicker(prev => !prev)}
                activeOpacity={0.8}
              >
                <Text style={styles.modalInputText}>{pickupTime || 'Select time'}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={timeValue}
                  mode="time"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event: any, selectedTime?: Date) => {
                    if (Platform.OS === 'android') setShowTimePicker(false);
                    if (selectedTime) {
                      const now = new Date();
                      let selectedDateForTime: Date;
                      if (pickupDate) {
                        const [y, m, d] = pickupDate.split('-').map(n => parseInt(n, 10));
                        selectedDateForTime = new Date(y, (m - 1), d);
                      } else {
                        selectedDateForTime = new Date();
                        setPickupDate(formatDate(selectedDateForTime));
                      }
                      const minDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                      const selDateOnly = new Date(selectedDateForTime.getFullYear(), selectedDateForTime.getMonth(), selectedDateForTime.getDate());
                      const candidate = new Date(selectedDateForTime);
                      candidate.setHours(selectedTime.getHours(), selectedTime.getMinutes(), 0, 0);

                      const isSameDay = selDateOnly.getTime() === minDate.getTime();
                      if (isSameDay && candidate < now) return;
                      
                      setTimeValue(selectedTime);
                      setPickupTime(formatTime(selectedTime));
                    }
                  }}
                />
              )}

              <Text style={styles.modalFormLabel}>Contact Number *</Text>
              <TextInput
                placeholder="e.g., 9842429243"
                keyboardType="phone-pad"
                placeholderTextColor="#999"
                style={styles.modalTextInput}
                value={contactNumber}
                onChangeText={setContactNumber}
              />

              <Text style={styles.modalFormLabel}>Notes (optional)</Text>
              <TextInput
                placeholder="Allergies, preferences, etc."
                placeholderTextColor="#999"
                style={[styles.modalTextInput, styles.modalTextArea]}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              <Text style={styles.modalFormLabel}>Payment Method *</Text>
              <View style={styles.paymentRow}>
                <TouchableOpacity
                  style={[styles.paymentButton, paymentMethod === 'cash' && styles.paymentSelected]}
                  onPress={() => setPaymentMethod('cash')}
                >
                  <Text style={[styles.paymentText, paymentMethod === 'cash' && styles.paymentTextSelected]}>
                    💵 Cash
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.paymentButton, paymentMethod === 'online' && styles.paymentSelected]}
                  onPress={() => setPaymentMethod('online')}
                >
                  <Text style={[styles.paymentText, paymentMethod === 'online' && styles.paymentTextSelected]}>
                    💳 Online
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity
                style={styles.saveDetailsButton}
                onPress={() => setOrderDetailsModal(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.saveDetailsText}>Save Details</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Cash Confirmation Modal */}
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
    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 14,
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 300,
  },
  // Cart Item Styles
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  itemInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  itemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginRight: 8,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
  },
  qtyButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  qtyButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '600',
  },
  qtyText: {
    marginHorizontal: 16,
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    minWidth: 24,
    textAlign: 'center',
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    marginLeft: 16,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#fee',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  removeText: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: '600',
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
  },
  // Details Section
  detailsSection: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  detailsSummary: {
    padding: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  warningBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ff9800',
    justifyContent: 'center',
    alignItems: 'center',
  },
  warningText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  summaryContent: {
    gap: 6,
  },
  summaryText: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  incompleteText: {
    fontSize: 14,
    color: '#ff9800',
    fontStyle: 'italic',
  },
  editLink: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginTop: 8,
  },
  // Total Section
  totalSection: {
    padding: 20,
    paddingBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  checkoutButton: {
    height: 56,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutDisabled: {
    opacity: 0.4,
  },
  checkoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  orderDetailsModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  modalClose: {
    fontSize: 28,
    color: '#666',
    fontWeight: '300',
  },
  modalContent: {
    padding: 20,
    maxHeight: 600,
  },
  modalFormLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
    marginTop: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    backgroundColor: '#fafafa',
  },
  modalInputText: {
    fontSize: 16,
    color: '#000',
  },
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#000',
    backgroundColor: '#fafafa',
  },
  modalTextArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  paymentRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  paymentButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    backgroundColor: '#fafafa',
    alignItems: 'center',
  },
  paymentSelected: {
    borderColor: '#000',
    backgroundColor: '#f0f0f0',
  },
  paymentText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  paymentTextSelected: {
    color: '#000',
  },
  saveDetailsButton: {
    marginTop: 32,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveDetailsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  // Cash Modal
  modalCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    elevation: 5,
  },
  modalText: {
    color: '#666',
    fontSize: 15,
    marginBottom: 24,
    lineHeight: 22,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
});

export default CartScreen;
