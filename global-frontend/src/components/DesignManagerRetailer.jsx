import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchDesigns, uploadDesign, updateDesign, deleteDesign } from '../api/designRetailerApi';

const BACKEND_ORIGIN = 'http://localhost:5000';
const IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.jpe', '.png', '.gif', '.webp', '.svg', '.bmp', '.avif'];

const isImageUrl = (url) => !!url && IMAGE_EXTENSIONS.some((ext) => url.toLowerCase().endsWith(ext));

const fileExtension = (url) => {
    if (!url) return 'FILE';
    const match = url.match(/\.([a-zA-Z0-9]+)$/);
    return match ? match[1].toUpperCase() : 'FILE';
};

const formatDate = (iso) => {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const emptyForm = { name: '', description: '', designFile: null };

const UploadIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
        <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
);

const DesignManagerRetailer = () => {
    const { user } = useContext(AuthContext);
    const [designs, setDesigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const loadDesigns = () => {
        setLoading(true);
        fetchDesigns(user.token)
            .then(setDesigns)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadDesigns();
    }, []);

    const startAdd = () => {
        setForm(emptyForm);
        setEditingId(null);
        setAdding(true);
        setError('');
    };

    const startEdit = (design) => {
        setForm({ name: design.name, description: design.description || '', designFile: null });
        setEditingId(design._id);
        setAdding(false);
        setError('');
    };

    const cancelForm = () => {
        setAdding(false);
        setEditingId(null);
        setForm(emptyForm);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            if (editingId) {
                await updateDesign(editingId, form, user.token);
            } else {
                await uploadDesign(form, user.token);
            }
            cancelForm();
            loadDesigns();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this design? This can\'t be undone.')) return;
        try {
            await deleteDesign(id, user.token);
            loadDesigns();
        } catch (err) {
            setError(err.message);
        }
    };

    const editingDesign = editingId ? designs.find((d) => d._id === editingId) : null;

    const uploadForm = (
        <form onSubmit={handleSubmit} className="flex flex-col">
            <label className="text-sm font-medium text-ink-900 mb-1">Name</label>
            <input
                type="text"
                placeholder="e.g. Mountain Logo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="mb-3 rounded-lg border border-hairline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-lime"
            />
            <label className="text-sm font-medium text-ink-900 mb-1">Description</label>
            <textarea
                placeholder="Tell us about your design..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="mb-3 rounded-lg border border-hairline px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent-lime"
            />
            <label className="text-sm font-medium text-ink-900 mb-1">Design file</label>
            <label className="mb-4 border-2 border-dashed border-hairline rounded-lg py-5 flex flex-col items-center justify-center gap-1 text-center cursor-pointer hover:border-accent-lime transition">
                <input
                    type="file"
                    onChange={(e) => setForm({ ...form, designFile: e.target.files[0] })}
                    className="hidden"
                />
                <span className="text-sm text-muted">
                    {form.designFile ? form.designFile.name : (
                        <>Drag and drop, or <span className="text-ink-900 font-medium underline">browse</span></>
                    )}
                </span>
                <span className="text-xs text-muted">PNG, JPG, SVG, PDF — max 10MB</span>
            </label>
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-accent-lime hover:brightness-95 text-ink-900 font-semibold rounded-lg py-2 text-sm transition disabled:opacity-60"
                >
                    {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Upload design'}
                </button>
                <button
                    type="button"
                    onClick={cancelForm}
                    className="px-4 rounded-lg border border-hairline text-sm text-ink-900 hover:bg-gray-50 transition"
                >
                    Cancel
                </button>
            </div>
        </form>
    );

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-semibold text-ink-900">My Designs</h2>
                <p className="text-sm text-muted mt-1">Artwork and specs you've sent to manufacturers for production.</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-[minmax(0,230px)_1fr] gap-5 items-start">
                <div
                    onClick={!adding && !editingId ? startAdd : undefined}
                    className={`border-2 border-dashed border-hairline rounded-xl p-5 flex flex-col ${!adding && !editingId ? 'items-center justify-center text-center cursor-pointer hover:border-accent-lime text-muted hover:text-ink-900' : ''} min-h-[198px] bg-[#eceee5] transition`}
                >
                    {!adding && !editingId && (
                        <>
                            <div className="w-9 h-9 rounded-lg bg-[#dbe3d6] text-[#3c5a44] flex items-center justify-center mb-2.5">
                                <UploadIcon />
                            </div>
                            <p className="text-sm font-semibold">Add a design</p>
                            <p className="text-xs text-muted mt-1">PNG, JPG or SVG, up to 10MB</p>
                        </>
                    )}

                    {adding && (
                        <div className="bg-white rounded-lg -m-5 p-5">
                            {uploadForm}
                        </div>
                    )}

                    {editingId && (
                        <div className="bg-white rounded-lg -m-5 p-5">
                            <p className="text-xs text-muted mb-3">Editing "{editingDesign?.name}"</p>
                            {uploadForm}
                        </div>
                    )}
                </div>

                <div>
                    {loading ? (
                        <p className="text-sm text-muted">Loading your designs…</p>
                    ) : designs.length === 0 ? (
                        <p className="text-sm text-muted text-center py-10 border border-hairline rounded-xl bg-white">
                            No designs yet — add your first one on the left.
                        </p>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4">
                            {designs.map((design) => (
                                <div key={design._id} className="bg-white rounded-lg border border-hairline overflow-hidden flex flex-col">
                                    <div className="h-32 bg-gray-50 flex items-center justify-center overflow-hidden">
                                        {isImageUrl(design.designFileUrl) ? (
                                            <img src={`${BACKEND_ORIGIN}${design.designFileUrl}`} alt={design.name} className="h-full w-full object-cover" />
                                        ) : design.designFileUrl ? (
                                            <span className="text-xs font-semibold tracking-wide text-muted border border-gray-200 rounded px-2 py-1">
                                                {fileExtension(design.designFileUrl)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-300">No file</span>
                                        )}
                                    </div>
                                    <div className="p-4 flex flex-col flex-grow">
                                        <h4 className="font-semibold text-ink-900 text-[14.5px] mb-1 truncate">{design.name}</h4>
                                        <p className="text-xs text-muted mb-3 flex-grow line-clamp-2">
                                            {design.description || 'No description added.'}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[11px] text-gray-400">{formatDate(design.createdAt)}</span>
                                            <div className="flex gap-1.5">
                                                <button
                                                    onClick={() => startEdit(design)}
                                                    className="w-[30px] h-[30px] rounded-lg border border-hairline flex items-center justify-center hover:bg-gray-50 transition"
                                                    aria-label={`Edit ${design.name}`}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(design._id)}
                                                    className="w-[30px] h-[30px] rounded-lg border border-red-200 text-red-600 flex items-center justify-center hover:bg-red-50 transition"
                                                    aria-label={`Delete ${design.name}`}
                                                >
                                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /></svg>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DesignManagerRetailer;