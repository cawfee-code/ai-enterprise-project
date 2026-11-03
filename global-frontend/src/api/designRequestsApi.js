const API_BASE = '/api';

export async function requestCustomDesignOrder({ designId, manufacturerBusinessName, quantity, note }, token) {
    const res = await fetch(`${API_BASE}/design-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ designId, manufacturerBusinessName, quantity, note }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send design request');
    return data;
}