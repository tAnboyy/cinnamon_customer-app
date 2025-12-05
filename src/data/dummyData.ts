import { MenuItem } from '../types';

export const menuItems: MenuItem[] = [
  { id: '1', name: 'Samosa', price: 5, description: 'Flaky pastry with spiced potato filling', image: 'https://images.unsplash.com/photo-1601050690183-3b57a9c0f8b2?q=80&w=600&auto=format&fit=crop', category: 'Appetizer', type: 'menu' },
  { id: '2', name: 'Paneer Tikka', price: 12, description: 'Marinated paneer grilled to perfection', image: 'https://images.unsplash.com/photo-1630409352402-9ad6c6c158b2?q=80&w=600&auto=format&fit=crop', category: 'Paneer', type: 'menu' },
  { id: '3', name: 'Tomato Soup', price: 7, description: 'Rich and creamy tomato soup', image: 'https://images.unsplash.com/photo-1551218808-94e220e084d2?q=80&w=600&auto=format&fit=crop', category: 'Soup', type: 'menu' },
  { id: '4', name: 'Manchow Soup', price: 8, description: 'Spicy Indo-Chinese soup with veggies', image: 'https://images.unsplash.com/photo-1547592180-61a069d79558?q=80&w=600&auto=format&fit=crop', category: 'Soup', type: 'menu' },
  { id: '5', name: 'Chili Paneer', price: 13, description: 'Crispy paneer tossed in chili sauce', image: 'https://images.unsplash.com/photo-1625944619794-541f6274955f?q=80&w=600&auto=format&fit=crop', category: 'Paneer', type: 'menu' },
  { id: '6', name: 'Aloo Tikki', price: 6, description: 'Crispy potato patties with chutney', image: 'https://images.unsplash.com/photo-1589308078054-8322fb1a3c7a?q=80&w=600&auto=format&fit=crop', category: 'Appetizer', type: 'menu' },
  { id: '7', name: 'Hara Bhara Kebab', price: 9, description: 'Spinach and peas kebab', image: 'https://images.unsplash.com/photo-1617096012907-016d9af70906?q=80&w=600&auto=format&fit=crop', category: 'Appetizer', type: 'menu' },
  { id: '8', name: 'Paneer Butter Masala', price: 14, description: 'Paneer in rich tomato-butter gravy', image: 'https://images.unsplash.com/photo-1642214213119-18aa04064db6?q=80&w=600&auto=format&fit=crop', category: 'Paneer', type: 'menu' },
];

export type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

export interface MealPlanSection {
  title: string; // 'Veg Meal' | 'Non-Veg Meal'
  priceLabel: string; // e.g., '$32 +tax'
  items: string[]; // item names
}

export const weeklyMealPlan: Record<DayName, { veg: MealPlanSection; nonVeg: MealPlanSection }> = {
  Monday: {
    veg: {
      title: 'Veg Meal',
      priceLabel: '$32 +tax',
      items: ['Chapati', 'Kathi roll', 'Kadai Paneer', 'Rice', 'Chapati', 'Gulab Jamun'],
    },
    nonVeg: {
      title: 'Non-Veg Meal',
      priceLabel: '$38 +tax',
      items: ['Chicken 65', 'Chicken Curry', 'Rice', 'Gulab Jamun', 'Chapati', 'Salad'],
    },
  },
  Tuesday: {
    veg: { title: 'Veg Meal', priceLabel: '$32 +tax', items: ['Chapati', 'Dal Fry', 'Paneer Tikka', 'Rice', 'Aloo Gobi', 'Sweet'] },
    nonVeg: { title: 'Non-Veg Meal', priceLabel: '$38 +tax', items: ['Chicken Biryani', 'Raita', 'Chapati', 'Chicken Curry', 'Rice', 'Sweet'] },
  },
  Wednesday: {
    veg: { title: 'Veg Meal', priceLabel: '$32 +tax', items: ['Chapati', 'Veg Korma', 'Paneer Butter Masala', 'Rice', 'Salad', 'Sweet'] },
    nonVeg: { title: 'Non-Veg Meal', priceLabel: '$38 +tax', items: ['Chicken Korma', 'Chapati', 'Rice', 'Fryums', 'Salad', 'Sweet'] },
  },
  Thursday: {
    veg: { title: 'Veg Meal', priceLabel: '$32 +tax', items: ['Chapati', 'Mixed Veg Curry', 'Palak Paneer', 'Rice', 'Papad', 'Sweet'] },
    nonVeg: { title: 'Non-Veg Meal', priceLabel: '$38 +tax', items: ['Chicken Tikka', 'Chapati', 'Rice', 'Dal', 'Papad', 'Sweet'] },
  },
  Friday: {
    veg: { title: 'Veg Meal', priceLabel: '$32 +tax', items: ['Chapati', 'Paneer Tikka', 'Jeera Rice', 'Dal Makhani', 'Salad', 'Sweet'] },
    nonVeg: { title: 'Non-Veg Meal', priceLabel: '$38 +tax', items: ['Chicken Tikka Masala', 'Chapati', 'Jeera Rice', 'Dal', 'Salad', 'Sweet'] },
  },
  Saturday: {
    veg: { title: 'Veg Meal', priceLabel: '$32 +tax', items: ['Poori', 'Chole', 'Veg Pulao', 'Raita', 'Salad', 'Sweet'] },
    nonVeg: { title: 'Non-Veg Meal', priceLabel: '$38 +tax', items: ['Chicken Pulao', 'Chapati', 'Raita', 'Salad', 'Papad', 'Sweet'] },
  },
  Sunday: {
    veg: { title: 'Veg Meal', priceLabel: '$32 +tax', items: ['Chapati', 'Paneer Kadai', 'Veg Biryani', 'Raita', 'Salad', 'Sweet'] },
    nonVeg: { title: 'Non-Veg Meal', priceLabel: '$38 +tax', items: ['Chicken Biryani', 'Chapati', 'Raita', 'Salad', 'Papad', 'Sweet'] },
  },
};