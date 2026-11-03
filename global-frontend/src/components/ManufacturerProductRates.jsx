import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { decodeJwtPayload } from '../utils/jwt';
import { fetchProducts, createProduct, updateProduct, deleteProduct } from '../api/manufacturerProductsApi';

const EMPTY_FORM = {
    name: '',
    description: '',
    baseManufacturingCost: '',
    targetMarginPercentage: '',
    physicalWeightKg: '',
    lengthCm: '',
    widthCm: '',
    heightCm: '',
    stockCount: ''
};

const ManufacturerProductRates = () => {
    const { user } = useContext(AuthContext);
    const myUserId = user?.token ? decodeJwtPayload(user.token)?.userId : null;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const loadProducts = () => {
        setLoading(true);
        setError('');
        fetchProducts()
            .then((all) => setProducts(all.filter((p) => p.manufacturerId === myUserId)))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const openCreateForm = () => {
        setEditingId(null);
        setForm(EMPTY_FORM);
        setIsFormOpen(true);
    };

    const openEditForm = (product) => {
        setEditingId(product._id);
        setForm({
            name: product.name,
            description: product.description || '',
            baseManufacturingCost: product.baseManufacturingCost,
            targetMarginPercentage: product.targetMarginPercentage,
            physicalWeightKg: product.physicalWeightKg,
            lengthCm: product.dimensions?.lengthCm,
            widthCm: product.dimensions?.widthCm,
            heightCm: product.dimensions?.heightCm,
            stockCount: product.stockCount
        });
        setIsFormOpen(true);
    };

    const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError('');
        try {
            const fields = {
                name: form.name,
                description: form.description,
                baseManufacturingCost: form.baseManufacturingCost,
                targetMarginPercentage: form.targetMarginPercentage,
                physicalWeightKg: form.physicalWeightKg,
                stockCount: form.stockCount,
                'dimensions[lengthCm]': form.lengthCm,
                'dimensions[widthCm]': form.widthCm,
                'dimensions[heightCm]': form.heightCm
            };

            if (editingId) {
                await updateProduct(editingId, fields, user.token);
            } else {
                await createProduct(fields, user.token);
            }

            setIsFormOpen(false);
            loadProducts();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        setError('');
        try {
            await deleteProduct(id, user.token);
            loadProducts();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-sage-200 mb-8">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
                <h2 className="text-xl font-bold text-olive-900">Your Printing Rates</h2>
                <button
                    onClick={openCreateForm}
                    className="px-4 py-2 bg-olive-900 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition"
                >
                    + Add product rate
                </button>
            </div>
            <p className="text-xs text-gray-500 mb-6">
                Set the base manufacturing cost and margin for each product you offer. The final retailer price is calculated automatically from these.
            </p>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {loading && <p className="text-sm text-gray-500">Loading...</p>}

            {!loading && products.length === 0 && !error && (
                <p className="text-sm text-gray-500">You haven't added any product rates yet.</p>
            )}

            {!loading && products.length > 0 && (
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-500 border-b border-sage-200">
                            <th className="py-2 pr-4">Product</th>
                            <th className="py-2 pr-4">Base Cost</th>
                            <th className="py-2 pr-4">Margin %</th>
                            <th className="py-2 pr-4">Final Price</th>
                            <th className="py-2 pr-4">Stock</th>
                            <th className="py-2 pr-4"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((p) => (
                            <tr key={p._id} className="border-b border-sage-100">
                                <td className="py-2.5 pr-4">{p.name}</td>
                                <td className="py-2.5 pr-4">${p.baseManufacturingCost?.toFixed(2)}</td>
                                <td className="py-2.5 pr-4">{p.targetMarginPercentage}%</td>
                                <td className="py-2.5 pr-4">${p.price?.toFixed(2)}</td>
                                <td className="py-2.5 pr-4">{p.stockCount}</td>
                                <td className="py-2.5 pr-4 text-right space-x-3">
                                    <button onClick={() => openEditForm(p)} className="text-xs text-blue-600 hover:underline">Edit</button>
                                    <button onClick={() => handleDelete(p._id)} className="text-xs text-red-600 hover:underline">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {isFormOpen && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
                    <form
                        onSubmit={handleSubmit}
                        className="bg-white rounded-2xl p-6 w-full max-w-md shadow-lg space-y-3"
                    >
                        <h3 className="text-lg font-bold text-olive-900 mb-2">
                            {editingId ? 'Edit product rate' : 'Add product rate'}
                        </h3>

                        <label className="block text-sm">
                            Product name
                            <input required value={form.name} onChange={handleChange('name')} className="mt-1 w-full border border-sage-200 rounded-lg px-3 py-2" />
                        </label>

                        <label className="block text-sm">
                            Description
                            <input value={form.description} onChange={handleChange('description')} className="mt-1 w-full border border-sage-200 rounded-lg px-3 py-2" />
                        </label>

                        <label className="block text-sm">
                            Base printing rate ($)
                            <input required type="number" min="0" step="0.01" value={form.baseManufacturingCost} onChange={handleChange('baseManufacturingCost')} className="mt-1 w-full border border-sage-200 rounded-lg px-3 py-2" />
                        </label>

                        <label className="block text-sm">
                            Target margin (%)
                            <input required type="number" min="0" step="0.1" value={form.targetMarginPercentage} onChange={handleChange('targetMarginPercentage')} className="mt-1 w-full border border-sage-200 rounded-lg px-3 py-2" />
                        </label>

                        <label className="block text-sm">
                            Weight (kg)
                            <input required type="number" min="0" step="0.01" value={form.physicalWeightKg} onChange={handleChange('physicalWeightKg')} className="mt-1 w-full border border-sage-200 rounded-lg px-3 py-2" />
                        </label>

                        <div className="grid grid-cols-3 gap-2">
                            <label className="block text-sm">
                                L (cm)
                                <input required type="number" min="0" step="0.1" value={form.lengthCm} onChange={handleChange('lengthCm')} className="mt-1 w-full border border-sage-200 rounded-lg px-3 py-2" />
                            </label>
                            <label className="block text-sm">
                                W (cm)
                                <input required type="number" min="0" step="0.1" value={form.widthCm} onChange={handleChange('widthCm')} className="mt-1 w-full border border-sage-200 rounded-lg px-3 py-2" />
                            </label>
                            <label className="block text-sm">
                                H (cm)
                                <input required type="number" min="0" step="0.1" value={form.heightCm} onChange={handleChange('heightCm')} className="mt-1 w-full border border-sage-200 rounded-lg px-3 py-2" />
                            </label>
                        </div>

                        <label className="block text-sm">
                            Stock count
                            <input required type="number" min="0" value={form.stockCount} onChange={handleChange('stockCount')} className="mt-1 w-full border border-sage-200 rounded-lg px-3 py-2" />
                        </label>

                        <div className="flex justify-end gap-2 pt-2">
                            <button type="button" onClick={() => setIsFormOpen(false)} className="px-4 py-2 text-sm rounded-lg border border-sage-200">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving} className="px-4 py-2 text-sm rounded-lg bg-olive-900 text-white font-semibold disabled:opacity-60">
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ManufacturerProductRates;