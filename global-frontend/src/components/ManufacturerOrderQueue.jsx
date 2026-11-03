import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const COLUMNS = [
    { status: 'pending', label: 'Pending' },
    { status: 'processing', label: 'Printed' }
];

const ManufacturerOrderQueue = () => {
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [draggedId, setDraggedId] = useState(null);

    const fetchOrders = () => {
        setLoading(true);
        setError('');
        fetch('/api/manufacturer-orders', {
            headers: { Authorization: `Bearer ${user?.token}` }
        })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => setOrders(json.data || []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchOrders();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateStatus = (orderId, newStatus) => {
        const previous = orders;
        setOrders((prev) => prev.map((o) => (o._id === orderId ? { ...o, status: newStatus } : o)));

        fetch(`/api/manufacturer-orders/${orderId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${user?.token}`
            },
            body: JSON.stringify({ status: newStatus })
        })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
            })
            .catch((err) => {
                setError(err.message);
                setOrders(previous); // roll back on failure
            });
    };

    const handleDrop = (newStatus) => {
        if (draggedId) {
            updateStatus(draggedId, newStatus);
            setDraggedId(null);
        }
    };

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-sage-200 mb-8">
            <h2 className="text-xl font-bold text-olive-900 mb-2">Production Queue</h2>
            <p className="text-xs text-gray-500 mb-6">
                Drag an order card to "Printed" once it's physically printed and ready for the next stage.
            </p>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {loading && <p className="text-sm text-gray-500">Loading...</p>}

            {!loading && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {COLUMNS.map((col) => {
                        const columnOrders = orders.filter((o) => o.status === col.status);
                        return (
                            <div
                                key={col.status}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={() => handleDrop(col.status)}
                                className="bg-sage-50 rounded-xl border border-sage-200 p-4 min-h-[200px]"
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-olive-900">{col.label}</h3>
                                    <span className="text-xs text-gray-500">{columnOrders.length}</span>
                                </div>

                                {columnOrders.length === 0 && (
                                    <p className="text-xs text-gray-400">No orders here.</p>
                                )}

                                <div className="space-y-3">
                                    {columnOrders.map((order) => (
                                        <div
                                            key={order._id}
                                            draggable
                                            onDragStart={() => setDraggedId(order._id)}
                                            className="bg-white rounded-lg border border-sage-200 p-3 shadow-sm cursor-grab active:cursor-grabbing"
                                        >
                                            <p className="font-medium text-sm text-ink-900">{order.productName}</p>
                                            <p className="text-xs text-gray-500">
                                                Qty: {order.quantity} &middot; {order.retailerEmail}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(order.createdAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ManufacturerOrderQueue;