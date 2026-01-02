import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { getWeeklyMealPlan } from '../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { addToCart } from '../redux/cartSlice';
import { updateQuantity } from '../redux/cartSlice';
import { RootState } from '../redux/store';

const MealPlanScreen = () => {
  const [sections, setSections] = useState<Array<{ title: string; data: any[] }>>([]);
  const dispatch = useDispatch();
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getWeeklyMealPlan()
        .then((resp) => {
          if (!active) return;
          const data = resp.data || {};
          const mapped = days.map((day) => {
            const d = data[day] || {};
            return {
              title: day,
              data: [d.veg, d.nonVeg].filter(Boolean),
            };
          });
          setSections(mapped);
        })
        .catch((e) => {
          console.error('Failed to load weekly meal plan', e);
        });

      return () => {
        active = false;
      };
    }, [])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Weekly Meal Plans</Text>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => `${item.title}-${index}`}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeaderContainer}>
            <Text style={styles.sectionHeader}>{title}</Text>
          </View>
        )}
        renderItem={({ item, index, section }) => (
          <View style={[styles.mealCard, index === 0 && styles.firstMealCard]}>
            <View style={styles.mealHeader}>
              <Text style={styles.mealTitle}>{item.title}</Text>
              <Text style={styles.mealPrice}>{item.priceLabel}</Text>
            </View>
            {(item.items as string[]).map((name: string, idx: number) => (
              <Text key={`${item.title}-${idx}`} style={styles.mealItem}>• {name}</Text>
            ))}
            {(() => {
              const day = section.title;
              const mealType = item.title; // 'Veg Meal' or 'Non-Veg Meal'
              const id = `meal-${day}-${mealType}`;
              const priceMatch = String(item.priceLabel).match(/\$(\d+)/);
              const price = priceMatch ? Number(priceMatch[1]) : 0;
              const description = (item.items as string[]).join(', ');
              const cartItems = useSelector((state: RootState) => state.cart.items);
              const quantity = cartItems.find(i => i.id === id)?.quantity || 0;
              if (quantity === 0) {
                return (
                  <TouchableOpacity style={styles.button} onPress={() => dispatch(addToCart({ id, name: `${mealType} (${day})`, price, description, category: 'Meal Plan', type: 'menu' }))}>
                    <Text style={styles.buttonText}>Add to Cart</Text>
                  </TouchableOpacity>
                );
              }
              return (
                <View style={styles.qtyControls}>
                  <TouchableOpacity
                    style={styles.qtyCircle}
                    onPress={() => dispatch(updateQuantity({ id, quantity: quantity - 1 }))}
                  >
                    <Text style={styles.qtyCircleText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.qtyCount}>{quantity}</Text>
                  <TouchableOpacity
                    style={styles.qtyCircle}
                    onPress={() => dispatch(updateQuantity({ id, quantity: quantity + 1 }))}
                  >
                    <Text style={styles.qtyCircleText}>+</Text>
                  </TouchableOpacity>
                </View>
              );
            })()}
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 24, paddingTop: 8 }}
        stickySectionHeadersEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 8,
  },
  screenTitle: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    marginTop: 12,
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
  sectionHeaderContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: 16,
    color: '#000',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  dayHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  firstMealCard: {
    marginTop: 12,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000',
  },
  mealPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  mealItem: {
    fontSize: 14,
    color: '#444',
    marginVertical: 3,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 12,
    minWidth: 120,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  qtyControls: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 4,
    gap: 8,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  qtyCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  addButton: {
    marginTop: 10,
    backgroundColor: '#000',
    borderRadius: 6,
    paddingVertical: 10,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default MealPlanScreen;
