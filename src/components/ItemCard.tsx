import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MenuItem } from '../types';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart, updateQuantity } from '../redux/cartSlice';
import { RootState } from '../redux/store';

interface ItemCardProps {
  item: MenuItem;
  hideAdd?: boolean; // when true, do not show Add/quantity controls
  hideQuantityBadge?: boolean; // when true, do not show quantity badge on image
  hidePrice?: boolean; // when true, hide price text
}

const ItemCard: React.FC<ItemCardProps> = ({ item, hideAdd = false, hideQuantityBadge = false, hidePrice = false }) => {
  const dispatch = useDispatch();
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const quantity = cartItems.find(i => i.id === item.id)?.quantity || 0;

  return (
    <View style={styles.card}>
      <View>
        <Image source={{ uri: item.image || 'https://via.placeholder.com/150' }} style={styles.image} />
        {(!hideQuantityBadge && quantity > 0) && (
          <View style={styles.quantityBadge}>
            <Text style={styles.quantityText}>{quantity}</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        {hidePrice ? null : (
          <Text style={styles.price}>${item.price.toFixed(2)}</Text>
        )}
      </View>
      {hideAdd ? null : (
        quantity === 0 ? (
          <TouchableOpacity style={styles.button} onPress={() => dispatch(addToCart(item))}>
            <Text style={styles.buttonText}>Add to Cart</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.qtyControls}>
            <TouchableOpacity
              style={styles.qtyCircle}
              onPress={() => dispatch(updateQuantity({ id: item.id, quantity: quantity - 1 }))}
            >
              <Text style={styles.qtyCircleText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyCount}>{quantity}</Text>
            <TouchableOpacity
              style={styles.qtyCircle}
              onPress={() => dispatch(updateQuantity({ id: item.id, quantity: quantity + 1 }))}
            >
              <Text style={styles.qtyCircleText}>+</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 16,
        marginVertical: 8,
        marginHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        elevation: 2,
      },
      image: {
        width: 80,
        height: 80,
        borderRadius: 8,
      },
      quantityBadge: {
        position: 'absolute',
        right: -8,
        top: -8,
        backgroundColor: '#4CAF50',
        borderRadius: 12,
        minWidth: 24,
        height: 24,
        paddingHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
      },
      quantityText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
      },
      info: {
        flex: 1,
        marginLeft: 16,
      },
      name: {
        fontSize: 16,
        color: '#666',
        fontWeight: 'bold'
      },
      description: {
        fontSize: 14,
        color: '#666',
        marginVertical: 4,
      },
      price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4CAF50',
      },
      button: {
        backgroundColor: '#FFC107',
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 20,
      },
      buttonText: {
        color: 'white',
        fontWeight: 'bold',
      },
      qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      },
      qtyCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#f2f2f2',
        justifyContent: 'center',
        alignItems: 'center',
      },
      qtyCircleText: {
        color: '#000',
        fontSize: 18,
        fontWeight: '600',
      },
      qtyCount: {
        minWidth: 24,
        textAlign: 'center',
        color: '#000',
        fontSize: 16,
        fontWeight: '600',
      },
});

export default ItemCard;
