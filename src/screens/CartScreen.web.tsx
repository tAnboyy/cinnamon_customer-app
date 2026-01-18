import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, Platform, ScrollView } from 'react-native';
import * as Linking from 'expo-linking';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
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

const CartScreen = () => {
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const stripe = useStripe();
  const elements = useElements();

  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('cash');
  const [confirmCashModal, setConfirmCashModal] = useState(false);
  const [orderDetailsModal, setOrderDetailsModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Minimum selectable date (today) in YYYY-MM-DD (local) to prevent past date selection
  const pad = (n: number) => n < 10 ? `0${n}` : `${n}`;
  const todayLocal = new Date();
  const minDate = `${todayLocal.getFullYear()}-${pad(todayLocal.getMonth() + 1)}-${pad(todayLocal.getDate())}`;
  
  const totalAmount = useMemo(
    () => cartItems.reduce((sum, i) => sum + (typeof i.price === 'number' ? i.price * i.quantity : 0), 0),
    [cartItems]
  );

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
      }
      
      if (defaultNotes && !notes) {
        setNotes(defaultNotes);
      }
    } catch (error) {
      console.error('[CartScreen] Failed to load defaults:', error);
    }
  };

  const submitOrder = async (paymentIntentId?: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      if (Platform.OS === 'web') {
        alert('Please sign in to place an order.');
      } else {
        Alert.alert('Not signed in', 'Please sign in to place an order.');
      }
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
      await placeOrder(order as any);
      dispatch(clearCart());
      
      // Navigate to confirmation screen instead of showing alert
      navigation.navigate('PaymentConfirmation', { 
        amount: totalAmount, 
        pickupDate, 
        pickupTime,
        paymentMethod 
      });
    } catch (error) {
      console.error('[CartScreen] Place order failed', (error as any)?.message || error);
      if (Platform.OS === 'web') {
        alert('Could not place order. Please try again.');
      } else {
        Alert.alert('Error', 'Could not place order.');
      }
    }
  };

  const handleCheckout = async () => {
    console.log('[CartScreen] handleCheckout called', { pickupDate, pickupTime, contactNumber, paymentMethod });
    
    if (!pickupDate || !pickupTime || !contactNumber) {
      if (Platform.OS === 'web') {
        alert('Please fill pickup date, time, and contact number.');
      } else {
        Alert.alert('Missing Info', 'Please fill pickup date, time, and contact number.');
      }
      return;
    }

    // Prevent past date selection
    if (pickupDate) {
      const [y, m, d] = pickupDate.split('-').map((s: string) => parseInt(s, 10));
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const selected = new Date(y, m - 1, d);
        const [minY, minM, minD] = minDate.split('-').map((s) => parseInt(s, 10));
        const minSelected = new Date(minY, minM - 1, minD);
        if (selected < minSelected) {
          if (Platform.OS === 'web') {
            alert('Please select today or a future date for pickup.');
          } else {
            Alert.alert('Invalid Date', 'Please select today or a future date for pickup.');
          }
          return;
        }
      }
    }
    
    if (paymentMethod === 'online') {
      // Web payment using Stripe Elements
      if (!stripe || !elements) {
        if (Platform.OS === 'web') {
          alert('Stripe is not loaded');
        } else {
          Alert.alert('Payment Error', 'Stripe is not loaded');
        }
        return;
      }

      try {
        setIsProcessing(true);
        const amountCents = Math.round(totalAmount * 100);
        const userEmail = auth.currentUser?.email || '';
        let customerId = await AsyncStorage.getItem('stripe_customer_id');
        
        console.log('[CartScreen] Calling getPaymentSheetParams', { amountCents, userEmail, customerId });
        const sheetResp = await getPaymentSheetParams(amountCents, userEmail, customerId || undefined);
        console.log('[CartScreen] getPaymentSheetParams response:', sheetResp);

        if (sheetResp?.error) {
          if (sheetResp.error.includes('customer')) {
            await AsyncStorage.removeItem('stripe_customer_id');
          }
          if (Platform.OS === 'web') {
            alert(sheetResp.error);
          } else {
            Alert.alert('Payment Error', sheetResp.error);
          }
          setIsProcessing(false);
          return;
        }
        
        const { paymentIntent, customer } = sheetResp;
        
        if (!paymentIntent) {
          if (Platform.OS === 'web') {
            alert('Failed to initialize payment');
          } else {
            Alert.alert('Payment Error', 'Failed to initialize payment');
          }
          setIsProcessing(false);
          return;
        }

        if (customer && customer !== customerId) {
          await AsyncStorage.setItem('stripe_customer_id', customer);
        }

        // Confirm payment using CardElement
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
          if (Platform.OS === 'web') {
            alert('Card element not found');
          } else {
            Alert.alert('Payment Error', 'Card element not found');
          }
          setIsProcessing(false);
          return;
        }

        console.log('[CartScreen] Confirming card payment...');
        const { error, paymentIntent: confirmedIntent } = await stripe.confirmCardPayment(paymentIntent, {
          payment_method: {
            card: cardElement,
            billing_details: {
              email: userEmail,
            },
          },
        });

        if (error) {
          console.error('[CartScreen] Payment error:', error);
          if (Platform.OS === 'web') {
            alert(error.message || 'Payment failed');
          } else {
            Alert.alert('Payment Error', error.message || 'Payment failed');
          }
        } else if (confirmedIntent?.status === 'succeeded') {
          console.log('[CartScreen] Payment succeeded, submitting order...');
          await submitOrder(confirmedIntent.id);
        }
      } catch (e) {
        console.error('[CartScreen] Exception:', e);
        if (Platform.OS === 'web') {
          alert((e as any)?.message || 'Failed to initiate online payment.');
        } else {
          Alert.alert('Payment Error', (e as any)?.message || 'Failed to initiate online payment.');
        }
      } finally {
        setIsProcessing(false);
      }
    } else {
      console.log('[CartScreen] Cash payment selected, showing confirmation modal');
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
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={{ padding: 8, marginRight: 16 }}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Text style={{ fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Your Cart</Text>
            <Text style={styles.itemCount}>{cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}</Text>
          </View>
        </View>

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
          showsVerticalScrollIndicator={Platform.OS === 'web'}
        />

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

          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalAmount}>${totalAmount.toFixed(2)}</Text>
            </View>
            
            {paymentMethod === 'online' && (
              <View style={styles.cardElementContainer}>
                {Platform.OS === 'web' ? (
                  <div style={{ width: '100%', minHeight: 40 }}>
                    <CardElement options={{ hidePostalCode: true }} />
                  </div>
                ) : (
                  <CardElement options={{ hidePostalCode: true }} />
                )}
              </View>
            )}
            
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

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={Platform.OS === 'web'}>
              <Text style={styles.modalFormLabel}>Pickup Date *</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="date"
                  value={pickupDate}
                  min={minDate}
                  onChange={(e: any) => setPickupDate(e.target.value)}
                  style={{
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    borderRadius: 10,
                    padding: 16,
                    fontSize: 16,
                    color: '#1a1a1a',
                    backgroundColor: '#fafafa',
                    outlineStyle: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              ) : (
                <TextInput
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor="#999"
                  style={styles.modalTextInput}
                  value={pickupDate}
                  onChangeText={setPickupDate}
                />
              )}

              <Text style={styles.modalFormLabel}>Pickup Time *</Text>
              {Platform.OS === 'web' ? (
                <input
                  type="time"
                  value={pickupTime}
                  onChange={(e: any) => setPickupTime(e.target.value)}
                  style={{
                    borderWidth: 1,
                    borderColor: '#e0e0e0',
                    borderRadius: 10,
                    padding: 16,
                    fontSize: 16,
                    color: '#1a1a1a',
                    backgroundColor: '#fafafa',
                    outlineStyle: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              ) : (
                <TextInput
                  placeholder="HH:MM"
                  placeholderTextColor="#999"
                  style={styles.modalTextInput}
                  value={pickupTime}
                  onChangeText={setPickupTime}
                />
              )}

              <Text style={styles.modalFormLabel}>Contact Number *</Text>
              <TextInput
                placeholder="e.g., 9842429243"
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
    </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,    backgroundColor: '#f5f5f5',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
    }),
  },
  contentWrapper: {
    flex: 1,
    maxWidth: Platform.OS === 'web' ? 1000 : undefined,
    width: '100%',
    alignSelf: 'center',    backgroundColor: '#f9f9f9',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
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
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
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
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  removeText: {
    fontSize: 18,
    color: '#d32f2f',
    fontWeight: '600',
  },
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
  cardElementContainer: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    backgroundColor: '#fafafa',
    marginBottom: 16,
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
  modalTextInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 10,
    padding: 16,
    fontSize: 16,
    color: '#1a1a1a',
    backgroundColor: '#fafafa',
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
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
    borderColor: '#e0e0e0',
    backgroundColor: '#fafafa',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  paymentSelected: {
    borderColor: '#1a1a1a',
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
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  saveDetailsText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
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
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  modalBtnText: {
    fontWeight: '700',
    fontSize: 15,
  },
});

export default CartScreen;
