const API_BASE = 'http://localhost:5000/api';

export async function register({ email, password }) {
    const res = await fetch(`${API_BASE}/manufacturers/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
    }
    return data;
}

export async function login({ email, password }) {
    const res = await fetch(`${API_BASE}/manufacturers/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'Login failed');
    }
    return data;
}