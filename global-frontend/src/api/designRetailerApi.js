const API_BASE = '/api';

export async function fetchDesigns(token) {
    const res = await fetch(`${API_BASE}/designs`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to load designs');
    return data;
}

export async function uploadDesign({ name, description, designFile }, token) {
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description ?? '');
    if (designFile) formData.append('designFile', designFile);

    const res = await fetch(`${API_BASE}/designs`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload design');
    return data;
}

export async function updateDesign(id, { name, description, designFile }, token) {
    const formData = new FormData();
    if (name) formData.append('name', name);
    formData.append('description', description ?? '');
    if (designFile) formData.append('designFile', designFile);

    const res = await fetch(`${API_BASE}/designs/${id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update design');
    return data;
}

export async function deleteDesign(id, token) {
    const res = await fetch(`${API_BASE}/designs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete design');
    return data;
}