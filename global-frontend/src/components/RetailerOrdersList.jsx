import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchMyOrders } from '../api/retailerOrdersApi';

const STATUS_LABELS = {
    pending: 'Pending',
    processing: 'Approved',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const STATUS_STYLES = {
    pending: 'bg-amber-50 text-amber-700 border-amber-200',
    processing: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    shipped: 'bg-blue-50 text-blue-700 border-blue-200',
    delivered: 'bg-[#eef3e6] text-[#3c5a44] border-[#d7e3da]',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const RetailerOrdersList = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchMyOrders(user.token)
            .then(setOrders)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-ink-900">My Orders</h2>
                <p className="text-sm text-muted mt-1">Track the status of everything you've requested from manufacturers.</p>
            </div>

            {loading && <p className="text-sm text-muted">Loading your orders...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && orders.length === 0 && (
                <p className="text-sm text-muted">You haven't requested any orders yet. Add products to your cart and request them to see them here.</p>
            )}

            {!loading && !error && orders.length > 0 && (
                <div className="flex flex-col gap-3">
                    {orders.map((order) => {
                        const status = order.status || 'pending';
                        return (
                            <div key={order._id} className="flex items-center justify-between gap-4 bg-white rounded-xl border border-hairline p-4">
                                <div>
                                    <p className="font-semibold text-ink-900 text-sm">
                                        {order.productId?.name || 'Product unavailable'}
                                    </p>
                                    <p className="text-[11px] text-muted mt-0.5">
                                        from {order.productId?.manufacturerId?.businessName || order.productId?.manufacturerId?.email || 'Unknown manufacturer'}
                                    </p>
                                    <p className="text-xs text-muted mt-1">
                                        Qty {order.quantity} · Requested {new Date(order.createdAt).toLocaleDateString()}
                                    </p>
                                </div>
                                <span className={`text-[11px] font-medium rounded-full border px-3 py-1 ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
                                    {STATUS_LABELS[status] || status}
                                </span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default RetailerOrdersList;