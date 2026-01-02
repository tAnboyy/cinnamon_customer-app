import axios from 'axios';
import { Platform } from 'react-native';
import { CartItem } from '../redux/cartSlice';

// Backend API (menu, orders, Stripe payments - everything)
const API_URL = 'http://172.20.1.229:8080/api';

console.log('[api] Base URL =', API_URL);


export const getMenuItems = () => {
    console.log('[api] GET /menu/all');
    const t0 = Date.now();
    return axios.get(`${API_URL}/menu/all`).then(r => {
        console.log('[api] /menu/all OK in', (Date.now() - t0), 'ms');
        return r;
    }).catch(err => {
        console.error('[api] /menu/all FAILED', err?.message || err);
        throw err;
    });
};

export const placeOrder = (order: { items: CartItem[], userId: string, paymentIntentId: string }) => {
    console.log('[api] POST /orders/place payload items=', order.items.length, 'userId=', order.userId);
    const t0 = Date.now();
    return axios.post(`${API_URL}/orders/place`, order).then(r => {
        console.log('[api] /orders/place OK in', (Date.now() - t0), 'ms');
        return r;
    }).catch(err => {
        console.error('[api] /orders/place FAILED', err?.message || err);
        throw err;
    });
}

export const createPaymentIntent = (amount: number) => {
    console.log('[api] POST /create-payment-intent amount=', amount);
    return axios.post(`${API_URL}/create-payment-intent`, { amount }).then(r => {
        console.log('[api] /create-payment-intent OK');
        return r.data;
    }).catch(err => {
        console.error('[api] /create-payment-intent FAILED', err?.message || err);
        throw err;
    });
}

export const getPaymentSheetParams = (amount: number, email?: string, customerId?: string) => {
    const requestData = { amount, email, customerId };
    console.log('[api] POST /payments/payment-sheet request data:', JSON.stringify(requestData, null, 2));
    return axios.post(`${API_URL}/payments/payment-sheet`, requestData).then(r => {
        console.log('[api] /payments/payment-sheet response status=', r.status);
        console.log('[api] Response data:', r.data);
        return r.data; // Return the data object, not the full axios response
    }).catch(err => {
        console.error('[api] /payments/payment-sheet FAILED status=', err?.response?.status, 'error=', err?.message || err);
        throw err;
    });
}

export async function fetchPaymentSheetParams(amount: number) {
  const res = await fetch(`${API_URL}/payments/payment-sheet`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Payment sheet request failed: ${res.status} ${text}`);
  }
  return res.json(); // { paymentIntent, ephemeralKey, customer, publishableKey }
}

export const createMealPlan = (plan: { userId: string, startDate: string, endDate: string, daysOfWeek: string[], pickupTime: string, items: CartItem[] }) => {
    console.log('[api] POST /plans/create userId=', plan.userId, 'items=', plan.items.length);
    return axios.post(`${API_URL}/plans/create`, plan);
}

export const getWeeklyMealPlan = () => {
    console.log('[api] GET /plans/weekly');
    return axios.get(`${API_URL}/plans/weekly`);
}

// Orders
export const getPastOrders = (userId: string) => {
    console.log('[api] GET /orders/{userId}', userId);
    const url = `${API_URL}/orders/${encodeURIComponent(userId)}`;
    const t0 = Date.now();
    return axios.get(url).then(r => {
        console.log('[api] /orders/{userId} OK count=', Array.isArray(r.data) ? r.data.length : (r.data?.items?.length || 0), 'in', (Date.now() - t0), 'ms');
        return r;
    }).catch(err => {
        console.error('[api] /orders/{userId} FAILED', err?.message || err);
        throw err;
    });
}