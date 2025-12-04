export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  type: 'menu' | 'catering';
}

export const menuItems: MenuItem[] = [
  { id: '1', name: 'Classic Burger', price: 12.99, description: 'A juicy beef patty with fresh vegetables.', image: 'https://via.placeholder.com/150', type: 'menu' },
  { id: '2', name: 'Margherita Pizza', price: 15.99, description: 'Classic pizza with tomato, mozzarella, and basil.', image: 'https://via.placeholder.com/150', type: 'menu' },
  { id: '3', name: 'Caesar Salad', price: 9.99, description: 'Crisp romaine lettuce with Caesar dressing.', image: 'https://via.placeholder.com/150', type: 'menu' },
];

export const cateringItems: MenuItem[] = [
    { id: '4', name: 'Party Platter', price: 49.99, description: 'An assortment of finger foods for 10-12 people.', image: 'https://via.placeholder.com/150', type: 'catering' },
    { id: '5', name: 'Large Lasagna', price: 79.99, description: 'A family-sized portion of our classic lasagna.', image: 'https://via.placeholder.com/150', type: 'catering' },
];
