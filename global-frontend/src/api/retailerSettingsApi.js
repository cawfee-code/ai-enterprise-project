const API_BASE = '/api';

export async function fetchRetailerSettings(token) {
    const res = await fetch(`${API_BASE}/retailer-settings/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load settings');
    return data;
}

export async function saveRetailerSettings(targetProfitPercentage, token) {
    const res = await fetch(`${API_BASE}/retailer-settings/me`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ targetProfitPercentage }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save settings');
    return data;
}

export async function deleteRetailerSettings(token) {
    const res = await fetch(`${API_BASE}/retailer-settings/me`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reset settings');
    return data;
}