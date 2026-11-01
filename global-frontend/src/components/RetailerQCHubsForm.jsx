import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchRetailerHubs, createRetailerHub, updateRetailerHub, deleteRetailerHub } from '../api/retailerHubsApi';

const emptyForm = { addressString: '', latitude: '', longitude: '' };

const RetailerQCHubsForm = () => {
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
        fetchRetailerHubs(user.token)
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
        setForm({
            addressString: hub.addressString,
            latitude: String(hub.location.coordinates[1]),
            longitude: String(hub.location.coordinates[0]),
        });
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
                await updateRetailerHub(editingId, form, user.token);
            } else {
                await createRetailerHub(form, user.token);
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
        if (!window.confirm('Remove this QC hub address? This can\'t be undone.')) return;
        try {
            await deleteRetailerHub(id, user.token);
            loadHubs();
        } catch (err) {
            setError(err.message);
        }
    };

    const renderForm = () => (
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <label className="text-sm font-medium text-ink-900 mb-1">Address</label>
            <input
                type="text"
                placeholder="e.g. 221 Harbor Rd, New York, NY"
                value={form.addressString}
                onChange={(e) => setForm({ ...form, addressString: e.target.value })}
                required
                className="mb-3 rounded-lg border border-hairline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-lime"
            />
            <div className="grid grid-cols-2 gap-2 mb-3">
                <div>
                    <label className="text-sm font-medium text-ink-900 mb-1 block">Latitude</label>
                    <input
                        type="number"
                        step="any"
                        min="-90"
                        max="90"
                        placeholder="e.g. 40.7128"
                        value={form.latitude}
                        onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                        required
                        className="w-full rounded-lg border border-hairline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-lime"
                    />
                </div>
                <div>
                    <label className="text-sm font-medium text-ink-900 mb-1 block">Longitude</label>
                    <input
                        type="number"
                        step="any"
                        min="-180"
                        max="180"
                        placeholder="e.g. -74.0060"
                        value={form.longitude}
                        onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                        required
                        className="w-full rounded-lg border border-hairline px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent-lime"
                    />
                </div>
            </div>
            <div className="flex gap-2 mt-auto">
                <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 bg-accent-lime hover:brightness-95 text-ink-900 font-semibold rounded-lg py-1.5 text-sm transition disabled:opacity-60"
                >
                    {submitting ? 'Saving…' : editingId ? 'Save changes' : 'Add QC hub'}
                </button>
                <button
                    type="button"
                    onClick={cancelForm}
                    className="px-3 rounded-lg border border-hairline text-sm text-ink-900"
                >
                    Cancel
                </button>
            </div>
        </form>
    );

    return (
        <div>
            <div className="flex items-baseline justify-between mb-1">
                <h2 className="text-2xl font-semibold text-ink-900">QC Hubs</h2>
                <span className="text-sm text-muted">{hubs.length} saved</span>
            </div>
            <p className="text-sm text-muted mb-6">
                Quality control hub addresses your shipments route through before reaching you.
            </p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4 max-w-sm">
                    {error}
                </div>
            )}

            {loading ? (
                <p className="text-sm text-muted">Loading your QC hubs…</p>
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {!adding && (
                        <button
                            onClick={startAdd}
                            className="border-2 border-dashed border-hairline rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-muted hover:border-accent-lime hover:text-ink-900 transition min-h-[160px] bg-[#eceee5]"
                        >
                            <span className="text-3xl leading-none">+</span>
                            <span className="text-sm font-medium">Add a QC hub</span>
                        </button>
                    )}

                    {adding && (
                        <div className="bg-white rounded-xl border border-hairline p-5 min-h-[160px]">
                            {renderForm()}
                        </div>
                    )}

                    {hubs.map((hub) =>
                        editingId === hub._id ? (
                            <div key={hub._id} className="bg-white rounded-xl border border-hairline p-5 min-h-[160px]">
                                {renderForm()}
                            </div>
                        ) : (
                            <div key={hub._id} className="bg-white rounded-xl border border-hairline p-5 flex flex-col">
                                <h3 className="font-semibold text-ink-900 mb-1 text-[15px]">{hub.addressString}</h3>
                                <p className="text-xs text-muted mb-4">
                                    {hub.location.coordinates[1].toFixed(4)}, {hub.location.coordinates[0].toFixed(4)}
                                </p>
                                <div className="flex gap-2 mt-auto">
                                    <button
                                        onClick={() => startEdit(hub)}
                                        className="flex-1 text-sm border border-hairline text-ink-900 rounded-lg py-1.5 hover:bg-gray-50 transition"
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

export default RetailerQCHubsForm;