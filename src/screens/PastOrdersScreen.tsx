import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, RefreshControl, TouchableOpacity, Platform } from 'react-native';
import ItemCard from '../components/ItemCard';
import { MenuItem } from '../types';
import { getPastOrders } from '../services/api';
import { auth } from '../firebaseConfig';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';

// Minimal order item type assumption aligning with MenuItem
interface OrderItem extends MenuItem { quantity?: number }
interface OrderDoc {
  id: string;
  status?: string;
  totalAmount?: number;
  createdAt?: any;
  items?: OrderItem[];
  pickupDate?: string;
  pickupTime?: string;
  paymentMethod?: string;
}

const PastOrdersScreen: React.FC = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState<OrderDoc[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const reorderOrder = (order: OrderDoc) => {
    try {
      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          const qty = typeof item.quantity === 'number' && item.quantity > 0 ? item.quantity : 1;
          const basePayload = {
            id: String(item.id),
            name: String(item.name || 'Item'),
            price: typeof item.price === 'number' ? item.price : 0,
            description: String(item.description || ''),
            category: String(item.category || 'Reorder'),
            image: item.image,
            type: item.type,
          } as MenuItem;
          for (let i = 0; i < qty; i++) {
            dispatch(addToCart(basePayload));
          }
        });
      }
    } catch (e) {
      console.error('[PastOrdersScreen] Reorder failed', e);
    }
  };

  const fetchOrders = async () => {
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user?.uid) {
  setOrders([]);
        setError('Please sign in to view past orders.');
        console.warn('[PastOrdersScreen] No authenticated user; cannot fetch past orders');
        return;
      }
      console.log('[PastOrdersScreen] Fetching past orders for userId=', user.uid);
      const t0 = Date.now();
  const res = await getPastOrders(user.uid);
  const t1 = Date.now();
  const raw = Array.isArray(res.data) ? res.data : (res.data?.orders || res.data || []);
  console.log('[PastOrdersScreen] Received', Array.isArray(raw) ? raw.length : 0, 'orders in', (t1 - t0), 'ms');
  const normalized = Array.isArray(raw) ? raw.map(normalizeOrder) : [];
  setOrders(normalized);
    } catch (e: any) {
      console.error('[PastOrdersScreen] Failed to fetch past orders', e?.message || e);
      setError('Unable to load past orders. Pull to retry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  if (loading) {
    return <ActivityIndicator size={48} style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.contentWrapper}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Past Orders</Text>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <FlatList
        data={orders}
        keyExtractor={(order) => order.id}
        contentContainerStyle={{ paddingBottom: 160 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#1a1a1a" colors={['#1a1a1a']} />}
        showsVerticalScrollIndicator={Platform.OS === 'web'}
        ListEmptyComponent={() => (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>No past orders found.</Text>
          </View>
        )}
        renderItem={({ item: order }) => (
          <View style={styles.orderCard}>
            <View style={styles.orderHeader}>
              <Text style={styles.orderTitle}>Order #{order.id.slice(0, 6)}</Text>
              <View style={styles.headerRight}> 
                {order.paymentMethod ? <Text style={[styles.badge, styles.badgeNeutral]}>Payment: {order.paymentMethod}</Text> : null}
                <Text style={styles.orderTotal}>{typeof order.totalAmount === 'number' ? `$${order.totalAmount.toFixed(2)}` : '—'}</Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Created</Text>
              <Text style={styles.metaValue}>{formatDateOnly(order.createdAt)}{formatTimeOnly(order.createdAt) ? ` · ${formatTimeOnly(order.createdAt)}` : ''}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Pickup</Text>
              <Text style={styles.metaValue}>{order.pickupDate || '—'}{order.pickupTime ? ` · ${order.pickupTime}` : ''}</Text>
            </View>

            {/* payment method shown in header; no chips here to avoid duplication */}

            {Array.isArray(order.items) && order.items.length > 0 ? (
              <View style={styles.itemsList}>
                {order.items.map((it) => (
                  <View key={`${order.id}-${it.id}`} style={styles.itemRow}>
                    <Text style={styles.itemName}>{it.name}</Text>
                    <Text style={styles.itemQty}>× {typeof it.quantity === 'number' ? it.quantity : 1}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyItems}>No items in this order.</Text>
            )}

            <View style={styles.cardFooter}>
              <TouchableOpacity style={styles.reorderBtn} onPress={() => reorderOrder(order)} activeOpacity={0.85}>
                <Text style={styles.reorderText}>Reorder</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    ...(Platform.OS === 'web' && {
      minHeight: '100vh',
    }),
  },
  contentWrapper: {
    flex: 1,
    maxWidth: Platform.OS === 'web' ? 1200 : undefined,
    width: '100%',
    alignSelf: 'center',
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  screenTitle: {
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 4,
  },
  title: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
    paddingVertical: 12,
  },
  error: {
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  emptyWrap: {
    paddingTop: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
  orderCard: {
    marginHorizontal: Platform.OS === 'web' ? 'auto' : 16,
    marginVertical: 8,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    maxWidth: Platform.OS === 'web' ? 700 : undefined,
    width: Platform.OS === 'web' ? '90%' : undefined,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  orderStatus: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
    textTransform: 'uppercase',
  },
  orderMeta: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  orderTotal: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  reorderBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    minWidth: 100,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  reorderText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  itemsList: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fafafa',
  },
  itemName: {
    color: '#666',
    fontSize: 14,
    flex: 1,
  },
  itemQty: {
    color: '#1a1a1a',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 12,
  },
  emptyItems: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 8,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    fontSize: 11,
    fontWeight: '600',
  },
  badgeStatus: {
    backgroundColor: '#e8f5e9',
    color: '#2e7d32',
  },
  badgeNeutral: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '500',
  },
  metaValue: {
    fontSize: 13,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  cardFooter: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
});

export default PastOrdersScreen;

function normalizeOrder(raw: any): OrderDoc {
  const id = String(raw.id || raw.orderId || 'unknown');
  const status = raw.status || raw.orderStatus || undefined;
  const totalAmount = typeof raw.totalAmount === 'number' ? raw.totalAmount : (typeof raw.amount === 'number' ? raw.amount : undefined);
  const createdAt = raw.createdAt || raw.created_at || raw.timestamp || undefined;
  const items = Array.isArray(raw.items) ? raw.items : [];
  const pickupDate = raw.pickupDate || undefined;
  const pickupTime = raw.pickupTime || undefined;
  const paymentMethod = raw.paymentMethod || undefined;
  return { id, status, totalAmount, createdAt, items, pickupDate, pickupTime, paymentMethod };
}

function formatDateTime(ts: any): string {
  try {
    // Firestore Timestamp
    if (ts && typeof ts.toDate === 'function') {
      const d = ts.toDate();
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    // ISO or millis
    const d = new Date(ts);
    if (!isNaN(d.getTime())) {
      return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    return '-';
  } catch {
    return '-';
  }
}

function formatWeekday(ts: any): string {
  try {
    let d: Date | null = null;
    if (ts && typeof ts.toDate === 'function') {
      d = ts.toDate();
    } else {
      const candidate = new Date(ts);
      if (!isNaN(candidate.getTime())) d = candidate;
    }
    return d ? d.toLocaleDateString(undefined, { weekday: 'long' }) : '-';
  } catch {
    return '-';
  }
}

function toDateObj(ts: any): Date | null {
  try {
    if (ts && typeof ts.toDate === 'function') {
      return ts.toDate();
    }
    // If backend serialized com.google.cloud.Timestamp via Jackson, it may look like {seconds: number, nanos: number}
    if (ts && typeof ts === 'object') {
      const seconds = (ts as any).seconds ?? (ts as any)._seconds ?? (ts as any).epochSecond;
      const nanos = (ts as any).nanos ?? (ts as any)._nanoseconds ?? (ts as any).nano ?? 0;
      if (typeof seconds === 'number') {
        const ms = seconds * 1000 + (typeof nanos === 'number' ? Math.floor(nanos / 1e6) : 0);
        const dFromSN = new Date(ms);
        if (!isNaN(dFromSN.getTime())) return dFromSN;
      }
      // Some serializers may produce { "_seconds": number, "_nanoseconds": number }
    }
    // Try ISO string or millis
    const d = new Date(ts);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function formatDateOnly(ts: any): string {
  const d = toDateObj(ts);
  if (!d) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTimeOnly(ts: any): string {
  const d = toDateObj(ts);
  if (!d) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// reorderOrder implemented inside component to access dispatch
