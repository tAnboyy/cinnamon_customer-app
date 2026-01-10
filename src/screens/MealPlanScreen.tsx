import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, SectionList, TouchableOpacity, Platform } from 'react-native';
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
      <View style={styles.contentWrapper}>
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
        contentContainerStyle={{ paddingBottom: 160, paddingTop: 8 }}
        stickySectionHeadersEnabled={true}
        showsVerticalScrollIndicator={false}
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
  sectionHeaderContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: '#f8f8f8',
    paddingVertical: 12,
    paddingHorizontal: Platform.OS === 'web' ? 24 : 16,
    color: '#1a1a1a',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    textAlign: Platform.OS === 'web' ? 'center' : 'left',
  },
  dayHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  mealCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    marginHorizontal: Platform.OS === 'web' ? 'auto' : 16,
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
    color: '#1a1a1a',
  },
  mealPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  mealItem: {
    fontSize: 14,
    color: '#666',
    marginVertical: 3,
    lineHeight: 20,
  },
  button: {
    backgroundColor: '#1a1a1a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginTop: 12,
    minWidth: 120,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
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
    ...(Platform.OS === 'web' && {
      cursor: 'pointer',
    }),
  },
  qtyCircleText: {
    color: '#1a1a1a',
    fontSize: 18,
    fontWeight: '600',
  },
  qtyCount: {
    minWidth: 24,
    textAlign: 'center',
    color: '#1a1a1a',
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
