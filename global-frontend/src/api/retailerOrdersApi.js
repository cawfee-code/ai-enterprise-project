const API_BASE = '/api';

export async function fetchMyOrders(token) {
    const res = await fetch(`${API_BASE}/retailer-orders`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to fetch your orders');
    return data.data;
}