import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import useCartStore from '../store/useCartStore';
import { fetchRetailerHubs } from '../api/retailerHubsApi';
import { placeOrder } from '../api/ordersApi';
import { estimateShipping } from '../api/shippingEstimateApi';

const CartPage = () => {
    const { user } = useContext(AuthContext);
    const cart = useCartStore((state) => state.cart);
    const updateQuantity = useCartStore((state) => state.updateQuantity);
    const removeFromCart = useCartStore((state) => state.removeFromCart);

    const [hubs, setHubs] = useState([]);
    const [hubsLoading, setHubsLoading] = useState(true);
    const [selectedHubId, setSelectedHubId] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    const [shippingEstimates, setShippingEstimates] = useState({});
    const [estimateLoading, setEstimateLoading] = useState(false);

    useEffect(() => {
        fetchRetailerHubs(user.token)
            .then((data) => {
                setHubs(data);
                if (data.length > 0) setSelectedHubId(data[0]._id);
            })
            .catch((err) => setError(err.message))
            .finally(() => setHubsLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Recalculate shipping (Feature 4's real distance-based formula) whenever the
    // retailer picks a different delivery address or the cart contents change.
    useEffect(() => {
        if (!selectedHubId || cart.length === 0) {
            setShippingEstimates({});
            return;
        }
        setEstimateLoading(true);
        estimateShipping({
            hubId: selectedHubId,
            items: cart.map((item) => ({ productId: item.productId, quantity: item.quantity }))
        }, user.token)
            .then((res) => {
                const map = {};
                res.data.forEach((r) => { map[r.productId] = r; });
                setShippingEstimates(map);
            })
            .catch(() => setShippingEstimates({}))
            .finally(() => setEstimateLoading(false));
    }, [selectedHubId, cart, user.token]);

    const total = cart.reduce((sum, item) => sum + item.quantity * (item.price || 0), 0);
    const shippingTotal = Object.values(shippingEstimates).reduce((sum, r) => sum + (r.shippingCost || 0), 0);
    const grandTotal = total + shippingTotal;

    const handleRequest = async () => {
        setError('');
        setSuccessMessage('');

        if (!selectedHubId) {
            setError('Add and select a QC hub address before requesting your order.');
            return;
        }

        setSubmitting(true);
        let placedCount = 0;
        for (const item of cart) {
            try {
                await placeOrder({ productId: item.productId, quantity: item.quantity, hubId: selectedHubId }, user.token);
                removeFromCart(item.productId);
                placedCount += 1;
            } catch (err) {
                setError(`Stopped at "${item.name}": ${err.message}`);
                break;
            }
        }
        if (placedCount > 0) {
            setSuccessMessage(`${placedCount} item${placedCount > 1 ? 's' : ''} requested. The manufacturer will see ${placedCount > 1 ? 'them' : 'it'} in their production queue.`);
        }
        setSubmitting(false);
    };

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-ink-900">Cart</h2>
                <p className="text-sm text-muted mt-1">Review your items, pick a delivery address, and request them from the manufacturer.</p>
            </div>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {successMessage && <p className="text-sm text-green-700 mb-4">{successMessage}</p>}

            {cart.length === 0 && !successMessage && (
                <p className="text-sm text-muted">Your cart is empty. Add products from the catalog first.</p>
            )}

            {cart.length > 0 && (
                <>
                    <div className="flex flex-col gap-3 mb-6">
                        {cart.map((item) => (
                            <div key={item.productId} className="flex items-center justify-between gap-4 bg-white rounded-xl border border-hairline p-4">
                                <div>
                                    <p className="font-semibold text-ink-900 text-sm">{item.name}</p>
                                    <p className="text-xs text-muted">${item.price?.toFixed(2)} each</p>
                                    {item.pricingBreakdown && (
                                        <p className="text-[11px] text-muted mt-0.5">
                                            Operational cost ${item.pricingBreakdown.operationalCost?.toFixed(2)} · Billable weight {item.pricingBreakdown.billableWeightKg?.toFixed(2)}kg
                                        </p>
                                    )}
                                    {estimateLoading && (
                                        <p className="text-[11px] text-muted mt-0.5">Estimating shipping...</p>
                                    )}
                                    {!estimateLoading && shippingEstimates[item.productId] && !shippingEstimates[item.productId].error && (
                                        <p className="text-[11px] text-muted mt-0.5">
                                            Shipping ${shippingEstimates[item.productId].shippingCost.toFixed(2)} · {shippingEstimates[item.productId].distanceKm}km to this address
                                        </p>
                                    )}
                                    {!estimateLoading && shippingEstimates[item.productId]?.error && (
                                        <p className="text-[11px] text-amber-700 mt-0.5">{shippingEstimates[item.productId].error}</p>
                                    )}
                                </div>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="number"
                                        min="1"
                                        value={item.quantity}
                                        onChange={(e) => updateQuantity(item.productId, Math.max(1, parseInt(e.target.value, 10) || 1))}
                                        className="w-20 rounded-lg border border-hairline px-3 py-1.5 text-sm"
                                    />
                                    <span className="text-sm font-semibold w-20 text-right">
                                        ${(item.quantity * (item.price || 0)).toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() => removeFromCart(item.productId)}
                                        className="text-xs text-red-600 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl border border-hairline p-4 mb-6 max-w-sm">
                        <label className="block text-sm font-medium text-ink-900 mb-2">Deliver to</label>
                        {hubsLoading && <p className="text-sm text-muted">Loading your addresses...</p>}
                        {!hubsLoading && hubs.length === 0 && (
                            <p className="text-sm text-amber-700">
                                You don't have a QC hub address saved yet. Add one from the "QC Hubs" tab before requesting an order.
                            </p>
                        )}
                        {!hubsLoading && hubs.length > 0 && (
                            <select
                                value={selectedHubId}
                                onChange={(e) => setSelectedHubId(e.target.value)}
                                className="w-full rounded-lg border border-hairline px-3 py-2 text-sm"
                            >
                                {hubs.map((hub) => (
                                    <option key={hub._id} value={hub._id}>{hub.addressString}</option>
                                ))}
                            </select>
                        )}
                    </div>

                    <div className="max-w-sm mb-3">
                        <div className="flex items-center justify-between text-sm text-muted">
                            <span>Items</span>
                            <span>${total.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-muted">
                            <span>Shipping to this address</span>
                            <span>{estimateLoading ? '...' : `$${shippingTotal.toFixed(2)}`}</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between max-w-sm">
                        <span className="text-sm font-semibold text-ink-900">Total: ${grandTotal.toFixed(2)}</span>
                        <button
                            onClick={handleRequest}
                            disabled={submitting || hubs.length === 0}
                            className="px-5 py-2.5 bg-ink-900 text-accent-lime font-semibold text-sm rounded-lg hover:opacity-90 transition disabled:opacity-50"
                        >
                            {submitting ? 'Requesting...' : 'Request order'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

export default CartPage;