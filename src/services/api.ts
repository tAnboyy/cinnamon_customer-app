import axios from 'axios';
import { Platform } from 'react-native';
import { CartItem } from '../redux/cartSlice';

const API_URL = Platform.OS === 'android' ? 'http://172.20.9.246:8080/api' : 'http://localhost:8080/api';

export const getMenuItems = () => {
  return axios.get(`${API_URL}/menu/all`);
};

export const placeOrder = (order: { items: CartItem[], userId: string, paymentIntentId: string }) => {
    return axios.post(`${API_URL}/orders/place`, order);
}

export const createPaymentIntent = (amount: number) => {
    return axios.post(`${API_URL}/payments/create-payment-intent`, { amount });
}

export const getPaymentSheetParams = (amount: number) => {
    return axios.post(`${API_URL}/payments/payment-sheet`, { amount });
}

export const createMealPlan = (plan: { userId: string, startDate: string, endDate: string, daysOfWeek: string[], pickupTime: string, items: CartItem[] }) => {
    return axios.post(`${API_URL}/plans/create`, plan);
}

export const getWeeklyMealPlan = () => {
    return axios.get(`${API_URL}/plans/weekly`);
}