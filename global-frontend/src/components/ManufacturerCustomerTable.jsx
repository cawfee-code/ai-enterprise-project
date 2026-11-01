import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

const SEGMENT_STYLES = {
    VIP: 'bg-lime-100 text-lime-800',
    Regular: 'bg-blue-100 text-blue-800',
    'Churn Risk': 'bg-red-100 text-red-800',
    Unassigned: 'bg-gray-100 text-gray-600'
};

const ManufacturerCustomerTable = () => {
    const { user } = useContext(AuthContext);
    const [customers, setCustomers] = useState([]);
    const [segmentFilter, setSegmentFilter] = useState('All');
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const limit = 10;

    const fetchCustomers = () => {
        setLoading(true);
        setError('');
        const params = new URLSearchParams({ page, limit });
        if (segmentFilter !== 'All') params.append('segment', segmentFilter);

        fetch(`/api/manufacturer-customers?${params.toString()}`, {
            headers: { Authorization: `Bearer ${user?.token}` }
        })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => {
                setCustomers(json.data || []);
                setTotal(json.total || 0);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchCustomers();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [segmentFilter, page]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-sage-200 mb-8">
            <div className="flex justify-between items-center mb-2 flex-wrap gap-3">
                <h2 className="text-xl font-bold text-olive-900">Your Retailer Customers</h2>
                <select
                    value={segmentFilter}
                    onChange={(e) => {
                        setPage(1);
                        setSegmentFilter(e.target.value);
                    }}
                    className="px-3 py-2 border border-sage-200 rounded-lg text-sm"
                >
                    <option value="All">All segments</option>
                    <option value="VIP">VIP</option>
                    <option value="Regular">Regular</option>
                    <option value="Churn Risk">Churn Risk</option>
                    <option value="Unassigned">Unassigned</option>
                </select>
            </div>
            <p className="text-xs text-gray-500 mb-6">
                "Spent with you" and "Orders with you" reflect only this manufacturer's own order history.
                Segment labels are computed platform-wide by the clustering engine, across all manufacturers.
            </p>

            {error && <p className="text-sm text-red-600 mb-4">{error}</p>}
            {loading && <p className="text-sm text-gray-500">Loading...</p>}

            {!loading && customers.length === 0 && !error && (
                <p className="text-sm text-gray-500">No retailer customers found for this filter.</p>
            )}

            {!loading && customers.length > 0 && (
                <>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-sage-200">
                                <th className="py-2 pr-4">Email</th>
                                <th className="py-2 pr-4">Platform Segment</th>
                                <th className="py-2 pr-4">Spent With You</th>
                                <th className="py-2 pr-4">Orders With You</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.map((c) => (
                                <tr key={c._id} className="border-b border-sage-100">
                                    <td className="py-2.5 pr-4">{c.email}</td>
                                    <td className="py-2.5 pr-4">
                                        <span
                                            className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                                                SEGMENT_STYLES[c.platformSegment] || SEGMENT_STYLES.Unassigned
                                            }`}
                                        >
                                            {c.platformSegment}
                                        </span>
                                    </td>
                                    <td className="py-2.5 pr-4">${(c.spentWithYou || 0).toFixed(2)}</td>
                                    <td className="py-2.5 pr-4">{c.ordersWithYou || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div className="flex items-center justify-between mt-4 text-sm">
                        <span className="text-gray-500">
                            Page {page} of {totalPages} ({total} total)
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                                disabled={page <= 1}
                                className="px-3 py-1.5 border border-sage-200 rounded-lg disabled:opacity-40"
                            >
                                Prev
                            </button>
                            <button
                                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                                disabled={page >= totalPages}
                                className="px-3 py-1.5 border border-sage-200 rounded-lg disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ManufacturerCustomerTable;