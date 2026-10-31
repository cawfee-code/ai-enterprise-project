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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 16V4M12 4l-4 4M12 4l4 4" />
        <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
    </svg>
);

const GridIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
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
            <label className="text-sm font-medium text-olive-900 mb-1">Name</label>
            <input
                type="text"
                placeholder="e.g. Mountain Logo"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
                className="mb-3 rounded-lg border border-sage-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
            <label className="text-sm font-medium text-olive-900 mb-1">Description</label>
            <textarea
                placeholder="Tell us about your design..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="mb-3 rounded-lg border border-sage-200 px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-lime-400"
            />
            <label className="text-sm font-medium text-olive-900 mb-1">Design file</label>
            <label className="mb-4 border-2 border-dashed border-sage-200 rounded-lg py-5 flex flex-col items-center justify-center gap-1 text-center cursor-pointer hover:border-lime-400 transition">
                <input
                    type="file"
                    onChange={(e) => setForm({ ...form, designFile: e.target.files[0] })}
                    className="hidden"
                />
                <span className="text-sm text-gray-500">
                    {form.designFile ? form.designFile.name : (
                        <>Drag and drop, or <span className="text-olive-900 font-medium underline">browse</span></>
                    )}
                </span>
                <span className="text-xs text-gray-400">PNG, JPG, SVG, PDF — max 10MB</span>
            </label>
            <div className="flex gap-2">
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-lime-400 hover:bg-lime-500 text-olive-900 font-semibold rounded-lg py-2 text-sm transition disabled:opacity-60"
                >
                    {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Upload design'}
                </button>
                <button
                    type="button"
                    onClick={cancelForm}
                    className="px-4 rounded-lg border border-sage-200 text-sm text-olive-900 hover:bg-gray-50 transition"
                >
                    Cancel
                </button>
            </div>
        </form>
    );

    return (
        <div className="mt-12">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-olive-900">My Designs</h2>
                <p className="text-sm text-gray-500 mt-1">Upload and manage your custom designs</p>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                    {error}
                </div>
            )}

            <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] gap-6 items-start">
                {/* Left: add a design */}
                <div className="bg-white rounded-3xl border border-sage-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-lime-100 text-olive-900 flex items-center justify-center flex-shrink-0">
                            <UploadIcon />
                        </div>
                        <div>
                            <h3 className="font-semibold text-olive-900">Add a design</h3>
                            <p className="text-xs text-gray-500">Send new artwork to manufacturers</p>
                        </div>
                    </div>

                    {!adding && !editingId && (
                        <button
                            onClick={startAdd}
                            className="w-full mt-4 border-2 border-dashed border-sage-200 rounded-xl py-8 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-lime-400 hover:text-olive-900 transition"
                        >
                            <span className="text-3xl leading-none">+</span>
                            <span className="text-sm font-medium">Click to add a new design</span>
                        </button>
                    )}

                    {adding && <div className="mt-4">{uploadForm}</div>}

                    {editingId && (
                        <div className="mt-4">
                            <p className="text-xs text-gray-400 mb-3">Editing "{editingDesign?.name}"</p>
                            {uploadForm}
                        </div>
                    )}
                </div>

                {/* Right: design list */}
                <div className="bg-white rounded-3xl border border-sage-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-lime-100 text-olive-900 flex items-center justify-center flex-shrink-0">
                            <GridIcon />
                        </div>
                        <div>
                            <h3 className="font-semibold text-olive-900">Your designs ({designs.length})</h3>
                            <p className="text-xs text-gray-500">Manage, edit or delete your uploads</p>
                        </div>
                    </div>

                    {loading ? (
                        <p className="text-sm text-gray-500 mt-4">Loading your designs…</p>
                    ) : designs.length === 0 ? (
                        <p className="text-sm text-gray-400 mt-6 text-center py-6">
                            No designs yet — add your first one on the left.
                        </p>
                    ) : (
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                            {designs.map((design) => (
                                <div key={design._id} className="rounded-2xl border border-sage-200 overflow-hidden flex flex-col">
                                    <div className="h-28 bg-gray-50 flex items-center justify-center overflow-hidden">
                                        {isImageUrl(design.designFileUrl) ? (
                                            <img src={`${BACKEND_ORIGIN}${design.designFileUrl}`} alt={design.name} className="h-full w-full object-cover" />
                                        ) : design.designFileUrl ? (
                                            <span className="text-xs font-semibold tracking-wide text-gray-400 border border-gray-200 rounded px-2 py-1">
                                                {fileExtension(design.designFileUrl)}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-300">No file</span>
                                        )}
                                    </div>
                                    <div className="p-3 flex flex-col flex-grow">
                                        <h4 className="font-semibold text-olive-900 text-sm mb-1 truncate">{design.name}</h4>
                                        <p className="text-xs text-gray-500 mb-2 flex-grow line-clamp-2">
                                            {design.description || 'No description added.'}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-gray-400">{formatDate(design.createdAt)}</span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => startEdit(design)}
                                                    className="text-xs font-medium text-olive-900 border border-sage-200 rounded-lg px-2 py-1 hover:bg-gray-50 transition"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(design._id)}
                                                    className="text-xs font-medium text-red-600 border border-red-200 rounded-lg px-2 py-1 hover:bg-red-50 transition"
                                                >
                                                    Delete
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