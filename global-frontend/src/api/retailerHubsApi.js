const API_BASE = '/api';

export async function fetchRetailerHubs(token) {
    const res = await fetch(`${API_BASE}/retailer-hubs`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load QC hubs');
    return data;
}

export async function createRetailerHub({ pincode, addressLine }, token) {
    const res = await fetch(`${API_BASE}/retailer-hubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pincode, addressLine }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add QC hub');
    return data;
}

export async function updateRetailerHub(id, { pincode, addressLine }, token) {
    const res = await fetch(`${API_BASE}/retailer-hubs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ pincode, addressLine }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update QC hub');
    return data;
}

export async function deleteRetailerHub(id, token) {
    const res = await fetch(`${API_BASE}/retailer-hubs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete QC hub');
    return data;
}