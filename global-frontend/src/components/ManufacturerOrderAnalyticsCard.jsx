import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const ManufacturerOrderAnalyticsCard = () => {
    const { user } = useContext(AuthContext);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchAnalytics = () => {
        setLoading(true);
        setError('');
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        fetch(`/api/manufacturer-dashboard?${params.toString()}`, {
            headers: { Authorization: `Bearer ${user?.token}` }
        })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => setData(json.data || []))
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    // Load with no date filter on first render, so the tab shows everything by default
    // instead of staying blank until the retailer picks dates and clicks Fetch.
    useEffect(() => {
        fetchAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-sage-200 mb-8">
            <h2 className="text-xl font-bold text-olive-900 mb-2">Order Analytics</h2>
            <p className="text-xs text-gray-500 mb-1">
                Filter your order history by date range. Visualizations are coming in a future update —
                this card is wired to the live endpoint.
            </p>
            <p className="text-xs text-amber-700 mb-6">
                Revenue figures use current product pricing, not price at time of purchase (not tracked by the order record).
            </p>

            <div className="flex flex-wrap items-end gap-3 mb-6">
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Start date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 border border-sage-200 rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">End date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 border border-sage-200 rounded-lg text-sm"
                    />
                </div>
                <button
                    onClick={fetchAnalytics}
                    disabled={loading}
                    className="px-4 py-2 bg-olive-900 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Fetch'}
                </button>
            </div>

            {error && <p className="text-sm text-red-600 mb-4">Error: {error}</p>}

            {!loading && data && data.length === 0 && !error && (
                <p className="text-sm text-gray-500">No orders found for this range.</p>
            )}

            {!loading && data && data.length > 0 && (
                <div className="flex flex-col gap-2">
                    {data.map((row) => (
                        <div
                            key={row.date}
                            className="flex items-center justify-between px-4 py-2.5 bg-sage-50 rounded-lg border border-sage-200 text-sm"
                        >
                            <span className="text-gray-500">{row.date}</span>
                            <span>{row.ordersCount} orders</span>
                            <span>{row.unitsSold} units</span>
                            <span className="font-semibold">${row.totalRevenue.toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ManufacturerOrderAnalyticsCard;