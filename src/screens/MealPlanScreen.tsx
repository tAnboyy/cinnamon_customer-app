import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, FlatList, ActivityIndicator } from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../redux/store';
import { addToCart, updateQuantity, clearCart } from '../redux/cartSlice';
import { MenuItem } from '../types';
import { createMealPlan, getMenuItems } from '../services/api';

const MealPlanScreen = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [days, setDays] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const mealPlanItems = useSelector((state: RootState) => state.cart.items);
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchMenuItems = async () => {
      try {
        const response = await getMenuItems();
        setMenuItems(response.data);
      } catch (error) {
        console.error("Failed to fetch menu items:", error);
        Alert.alert("Error", "Could not load menu items.");
      } finally {
        setLoading(false);
      }
    };

    fetchMenuItems();
  }, []);

  const handleCreatePlan = async () => {
    if (!startDate || !days || !pickupTime || mealPlanItems.length === 0) {
      Alert.alert('Error', 'Please fill in all required fields and add items to the plan.');
      return;
    }

    const plan = {
      // Hardcoding userId for now, replace with actual user ID from auth state
      userId: 'testUser123', 
      startDate,
      endDate,
      daysOfWeek: days.split(',').map(day => day.trim()),
      pickupTime,
      items: mealPlanItems,
    };

    try {
      await createMealPlan(plan);
      Alert.alert('Success', 'Meal plan created successfully!');
      dispatch(clearCart());
      setStartDate('');
      setEndDate('');
      setDays('');
      setPickupTime('');
    } catch (error) {
      console.error('Error creating meal plan:', error);
      Alert.alert('Error', 'Failed to create meal plan. Please try again.');
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
      <TextInput style={styles.input} value={startDate} onChangeText={setStartDate} />

      <Text style={styles.label}>End Date (Optional)</Text>
      <TextInput style={styles.input} value={endDate} onChangeText={setEndDate} />

      <Text style={styles.label}>Days of the Week (e.g., Monday,Wednesday,Friday)</Text>
      <TextInput style={styles.input} value={days} onChangeText={setDays} />

      <Text style={styles.label}>Pickup Time (e.g., 12:00 PM)</Text>
      <TextInput style={styles.input} value={pickupTime} onChangeText={setPickupTime} />

      <Text style={styles.label}>Add Items to Meal Plan</Text>
      <FlatList
        data={menuItems}
        renderItem={({ item }) => {
          const planItem = mealPlanItems.find(i => i.id === item.id);
          const quantity = planItem?.quantity || 0;

          return (
            <View style={styles.itemContainer}>
              <Text>{item.name}</Text>
              <View style={styles.quantityContainer}>
                <Button title="-" onPress={() => dispatch(updateQuantity({ id: item.id, quantity: quantity - 1 }))} disabled={quantity === 0} />
                <Text style={styles.quantityText}>{quantity}</Text>
                <Button title="+" onPress={() => {
                  if (planItem) {
                    dispatch(updateQuantity({ id: item.id, quantity: quantity + 1 }));
                  } else {
                    dispatch(addToCart(item));
                  }
                }} />
              </View>
            </View>
          )
        }}
        keyExtractor={item => item.id}
      />

      <Button title="Create Meal Plan" onPress={handleCreatePlan} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#000',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    paddingLeft: 8,
    color: '#000',
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
  quantityText: {
    marginHorizontal: 10,
    fontSize: 16,
  },
});

export default MealPlanScreen;
