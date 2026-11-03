const API_BASE = '/api';

export async function placeOrder({ productId, quantity, hubId }, token) {
    const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ productId, quantity, hubId }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to place order');
    return data;
}