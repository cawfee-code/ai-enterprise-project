const API_BASE = '/api';

export async function fetchProducts() {
    const res = await fetch(`${API_BASE}/products`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load products');
    return data;
}

export async function createProduct(fields, token) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value);
    });

    const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create product');
    return data;
}

export async function updateProduct(id, fields, token) {
    const formData = new FormData();
    Object.entries(fields).forEach(([key, value]) => {
        if (value !== undefined && value !== null) formData.append(key, value);
    });

    const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update product');
    return data;
}

export async function deleteProduct(id, token) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete product');
    return data;
}