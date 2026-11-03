const API_BASE = '/api';

export async function estimateShipping({ hubId, items }, token) {
    const res = await fetch(`${API_BASE}/orders/shipping-estimate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hubId, items }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to estimate shipping');
    return data;
}