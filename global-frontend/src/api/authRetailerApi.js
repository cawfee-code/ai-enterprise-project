const API_BASE = '/api'; // Triggers the Vite proxy

export async function register({ email, password }) {
    const res = await fetch(`${API_BASE}/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'retailer' }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    return data;
}

export async function login({ email, password }) {
    const res = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'retailer' }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    return data;
}

// Note: You still need to build the /users/reset-password endpoint on the backend
export async function resetPassword({ email, newPassword }) {
    const res = await fetch(`${API_BASE}/users/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, newPassword, role: 'retailer' }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Password reset failed');
    return data;
}