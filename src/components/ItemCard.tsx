import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { MenuItem } from '../data/dummyData';
import { useDispatch } from 'react-redux';
import { addToCart } from '../redux/cartSlice';

interface ItemCardProps {
  item: MenuItem;
}

const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const dispatch = useDispatch();

  return (
    <View style={styles.card}>
      <Image source={{ uri: item.image }} style={styles.image} />
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        <Text style={styles.price}>${item.price.toFixed(2)}</Text>
      </View>
      <TouchableOpacity style={styles.button} onPress={() => dispatch(addToCart(item))}>
        <Text style={styles.buttonText}>Add to Cart</Text>
      </TouchableOpacity>
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
      info: {
        flex: 1,
        marginLeft: 16,
      },
      name: {
        fontSize: 16,
        fontWeight: 'bold',
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
});

export default ItemCard;
