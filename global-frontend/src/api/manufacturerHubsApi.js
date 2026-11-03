const API_BASE = '/api';

export async function fetchManufacturerHubs(token) {
    const res = await fetch(`${API_BASE}/manufacturer-hubs`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load warehouse hubs');
    return data;
}

export async function createManufacturerHub({ addressString, latitude, longitude }, token) {
    const res = await fetch(`${API_BASE}/manufacturer-hubs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ addressString, latitude, longitude }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add warehouse hub');
    return data;
}

export async function updateManufacturerHub(id, { addressString, latitude, longitude }, token) {
    const res = await fetch(`${API_BASE}/manufacturer-hubs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ addressString, latitude, longitude }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update warehouse hub');
    return data;
}

export async function deleteManufacturerHub(id, token) {
    const res = await fetch(`${API_BASE}/manufacturer-hubs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete warehouse hub');
    return data;
}