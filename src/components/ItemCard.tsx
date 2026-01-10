import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MenuItem } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateQuantity } from '../redux/cartSlice';
import { RootState } from '../redux/store';

interface ItemCardProps {
  item: MenuItem;
  hideAdd?: boolean; // when true, do not show Add/quantity controls
  hideQuantityBadge?: boolean; // when true, do not show quantity badge on image
  hidePrice?: boolean; // when true, hide price text
  compact?: boolean; // when true, use compact layout for two-column display
}

const ItemCard: React.FC<ItemCardProps> = ({ item, hideAdd = false, hideQuantityBadge = false, hidePrice = false, compact = false }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const quantity = cartItems.find(i => i.id === item.id)?.quantity || 0;

  return (
    <View style={[styles.card, compact && styles.compactCard, compact && hideAdd && { height: 180 }]}>
      {compact ? (
        // Compact horizontal layout for two-column grid
        <>
          <View style={styles.compactLayout}>
            <View style={styles.compactTop}>
              <View style={[styles.imageContainer, styles.compactImageContainer]}>
                <Image 
                  source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
                  style={styles.image}
                  resizeMode="cover"
                />
                {(!hideQuantityBadge && quantity > 0) && (
                  <View style={[styles.quantityBadge, styles.compactQuantityBadge]}>
                    <Text style={styles.quantityText}>{quantity}</Text>
                  </View>
                )}
              </View>
            </View>
            
            <View style={[styles.compactContent, hideAdd && { justifyContent: 'flex-start' }]}>
              {!hidePrice ? (
                <View style={styles.compactInfo}>
                  <Text style={styles.compactName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.compactPrice}>
                    {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : '-'}
                  </Text>
                </View>
              ) : (
                <Text style={[styles.compactName, { marginBottom: 4, lineHeight: 20, fontSize: 13, fontWeight: '800', color: '#000' }]}>{item.name}</Text>
              )}
              <Text style={[styles.compactDescription, hidePrice && { marginTop: 0 }]} numberOfLines={2}>{item.description}</Text>
              
              {!hideAdd && (
                <View style={styles.compactActions}>
                  {quantity === 0 ? (
                    <TouchableOpacity 
                      style={styles.compactButton} 
                      onPress={() => dispatch(addToCart(item))}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.compactButtonText}>Add</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.compactQtyControls}>
                      <TouchableOpacity
                        style={styles.compactQtyCircle}
                        onPress={() => dispatch(updateQuantity({ id: item.id, quantity: quantity - 1 }))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.compactQtyCircleText}>−</Text>
                      </TouchableOpacity>
                      <Text style={styles.compactQtyCount}>{quantity}</Text>
                      <TouchableOpacity
                        style={styles.compactQtyCircle}
                        onPress={() => dispatch(updateQuantity({ id: item.id, quantity: quantity + 1 }))}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.compactQtyCircleText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              )}
            </View>
          </View>
        </>
      ) : (
        // Original vertical layout
        <>
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: item.image || 'https://via.placeholder.com/150' }} 
              style={styles.image}
              resizeMode="cover"
            />
            {(!hideQuantityBadge && quantity > 0) && (
              <View style={styles.quantityBadge}>
                <Text style={styles.quantityText}>{quantity}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.contentContainer}>
            <View style={styles.textSection}>
              <View style={styles.headerRow}>
                <Text style={styles.name} numberOfLines={2}>{item.name}</Text>
                {!hidePrice && (
                  <View style={styles.priceContainer}>
                    <Text style={styles.price}>
                      {typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : '-'}
                    </Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
              
              {item.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>{item.category}</Text>
                </View>
              )}
            </View>
            
            {!hideAdd && (
              <View style={styles.actionSection}>
                {quantity === 0 ? (
                  <TouchableOpacity 
                    style={styles.button} 
                    onPress={() => dispatch(addToCart(item))}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.buttonText}>Add to Cart</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.qtyControls}>
                    <TouchableOpacity
                      style={styles.qtyCircle}
                      onPress={() => dispatch(updateQuantity({ id: item.id, quantity: quantity - 1 }))}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.qtyCircleText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyCount}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyCircle}
                      onPress={() => dispatch(updateQuantity({ id: item.id, quantity: quantity + 1 }))}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.qtyCircleText}>+</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  quantityBadge: {
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#000',
    borderRadius: 20,
    minWidth: 36,
    height: 36,
    paddingHorizontal: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  quantityText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  contentContainer: {
    padding: 16,
  },
  textSection: {
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  name: {
    flex: 1,
    fontSize: 18,
    color: '#000',
    fontWeight: '700',
    lineHeight: 24,
    marginRight: 12,
  },
  priceContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#f8f8f8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionSection: {
    marginTop: 4,
  },
  button: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 6,
    gap: 16,
  },
  qtyCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  qtyCircleText: {
    color: '#000',
    fontSize: 20,
    fontWeight: '700',
  },
  qtyCount: {
    minWidth: 32,
    textAlign: 'center',
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  
  // Compact styles for two-column layout
  compactCard: {
    marginVertical: 6,
    marginHorizontal: 0,
    height: 240,
  },
  compactLayout: {
    flex: 1,
    padding: 10,
  },
  compactTop: {
    width: '100%',
    marginBottom: 6,
  },
  compactImageContainer: {
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
  },
  compactQuantityBadge: {
    right: 6,
    top: 6,
    minWidth: 24,
    height: 24,
    paddingHorizontal: 6,
  },
  compactContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  compactInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  compactName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    lineHeight: 17,
    marginRight: 6,
  },
  compactPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
  },
  compactDescription: {
    fontSize: 11,
    color: '#666',
    lineHeight: 13,
    marginBottom: 4,
  },
  compactActions: {
    marginTop: 'auto',
  },
  compactButton: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  compactButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 12,
  },
  compactQtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    gap: 8,
  },
  compactQtyCircle: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  compactQtyCircleText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  compactQtyCount: {
    fontSize: 14,
    minWidth: 20,
    textAlign: 'center',
    color: '#000',
    fontWeight: '700',
  },
});

export default ItemCard;
