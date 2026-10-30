const API_BASE = 'http://localhost:5000/api';

export async function fetchProducts() {
    const res = await fetch(`${API_BASE}/products`);

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Failed to load products');
    }
    return data; // array of product objects
}