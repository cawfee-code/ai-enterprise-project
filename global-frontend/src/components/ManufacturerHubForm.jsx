import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchManufacturerHubs, createManufacturerHub, updateManufacturerHub, deleteManufacturerHub } from '../api/manufacturerHubsApi';

const emptyForm = { pincode: '' };

const ManufacturerHubForm = () => {
    const { user } = useContext(AuthContext);
    const [hubs, setHubs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [adding, setAdding] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [submitting, setSubmitting] = useState(false);

    const loadHubs = () => {
        setLoading(true);
        fetchManufacturerHubs(user.token)
            .then(setHubs)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadHubs();
    }, []);

    const startAdd = () => {
        setForm(emptyForm);
        setEditingId(null);
        setAdding(true);
        setError('');
    };

    const startEdit = (hub) => {
        setForm({ pincode: hub.addressString });
        setEditingId(hub._id);
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
                await updateManufacturerHub(editingId, form, user.token);
            } else {
                await createManufacturerHub(form, user.token);
            }
            cancelForm();
            loadHubs();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Remove this warehouse address? This can\'t be undone.')) return;
        try {
            await deleteManufacturerHub(id, user.token);
            loadHubs();
        } catch (err) {
            setError(err.message);
        }
    };

    const renderForm = () => (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <label className="text-sm font-medium text-olive-900 mb-1">Pin code</label>
            <input
                type="text"
                placeholder="e.g. 94103"
                value={form.pincode}
                onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                required
                className="mb-3 rounded-lg border border-sage-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-lime"
            />
            <div className="flex gap-2 mt-auto">
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-accent-lime hover:brightness-95 text-ink-900 font-semibold rounded-lg py-1.5 text-sm transition disabled:opacity-60"
                >
                    {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add warehouse'}
                </button>
                <button
                    type="button"
                    onClick={cancelForm}
                    className="px-3 rounded-lg border border-sage-200 text-sm text-olive-900"
                >
                    Cancel
                </button>
            </div>
        </form>
    );

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-sage-200 mb-8">
            <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-xl font-bold text-olive-900">Warehouse Address</h2>
                <span className="text-xs text-gray-500">{hubs.length} saved</span>
            </div>
            <p className="text-xs text-gray-500 mb-6">
                Your real shipping origin — used to calculate actual shipping cost for retailer orders.
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4 max-w-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <p className="text-sm text-gray-500">Loading your warehouse addresses…</p>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {!adding && (
                        <button
                            onClick={startAdd}
                            className="border-2 border-dashed border-sage-200 rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-gray-500 hover:border-accent-lime hover:text-olive-900 transition min-h-[160px] bg-sage-50"
                        >
                            <span className="text-3xl leading-none">+</span>
                            <span className="text-sm font-medium">Add a warehouse</span>
                        </button>
                    )}

                    {adding && (
                        <div className="bg-white rounded-xl border border-sage-200 p-5 min-h-[160px]">
                            {renderForm()}
                        </div>
                    )}

                    {hubs.map((hub) =>
                        editingId === hub._id ? (
                            <div key={hub._id} className="bg-white rounded-xl border border-sage-200 p-5 min-h-[160px]">
                                {renderForm()}
                            </div>
                        ) : (
                            <div key={hub._id} className="bg-white rounded-xl border border-sage-200 p-5 flex flex-col">
                                <h3 className="font-semibold text-olive-900 mb-1 text-[15px]">PIN {hub.addressString}</h3>
                                <p className="text-xs text-gray-500 mb-4">Located automatically</p>
                                <div className="flex gap-2 mt-auto">
                                    <button
                                        onClick={() => startEdit(hub)}
                                        className="flex-1 text-sm border border-sage-200 text-olive-900 rounded-lg py-1.5 hover:bg-gray-50 transition"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(hub._id)}
                                        className="flex-1 text-sm border border-red-200 text-red-600 rounded-lg py-1.5 hover:bg-red-50 transition"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}
        </div>
    );
};

export default ManufacturerHubForm;