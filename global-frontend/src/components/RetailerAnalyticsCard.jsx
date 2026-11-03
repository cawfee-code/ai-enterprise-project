import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip
} from 'recharts';

// Stacked-line style, same idea as Excel's "Stacked Line with Markers": the bottom series is
// what you actually paid (wholesale cost), and the top series is that same value plus the
// projected profit stacked on top of it — so the top line's height at any point always equals
// the bottom line's value + the profit for that day, never an independent line of its own.
const SERIES = {
    originalPrice: { label: 'Amount paid', color: '#6b9080' },
    sellingPrice: { label: 'Selling price (paid + profit, stacked)', color: '#c97b3e' }
};

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    const byKey = Object.fromEntries(payload.map((p) => [p.dataKey, p.value]));
    return (
        <div className="bg-white rounded-xl border border-hairline shadow-md px-4 py-3 min-w-[180px]">
            <p className="text-xs font-medium text-muted mb-2">{label}</p>
            {byKey.sellingPrice != null && (
                <div className="flex items-center justify-between gap-4 mb-1">
                    <span className="flex items-center gap-1.5 text-xs text-ink-900">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: SERIES.sellingPrice.color }} />
                        Selling price
                    </span>
                    <span className="text-sm font-semibold" style={{ color: SERIES.sellingPrice.color }}>
                        ${byKey.sellingPrice.toFixed(2)}
                    </span>
                </div>
            )}
            {byKey.originalPrice != null && (
                <div className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-1.5 text-xs text-ink-900">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: SERIES.originalPrice.color }} />
                        Amount paid
                    </span>
                    <span className="text-sm font-semibold" style={{ color: SERIES.originalPrice.color }}>
                        ${byKey.originalPrice.toFixed(2)}
                    </span>
                </div>
            )}
            {byKey.sellingPrice != null && byKey.originalPrice != null && (
                <div className="flex items-center justify-between gap-4 mt-2 pt-2 border-t border-hairline">
                    <span className="text-xs text-muted">Profit</span>
                    <span className="text-xs font-semibold text-muted">
                        +${(byKey.sellingPrice - byKey.originalPrice).toFixed(2)}
                    </span>
                </div>
            )}
        </div>
    );
};

const LegendRow = ({ showSellingPrice }) => (
    <div className="flex items-center gap-5 mb-5">
        {showSellingPrice && (
            <span className="flex items-center gap-2 text-xs font-medium text-ink-900">
                <span className="inline-block w-3 h-[3px] rounded-full" style={{ background: SERIES.sellingPrice.color }} />
                {SERIES.sellingPrice.label}
            </span>
        )}
        <span className="flex items-center gap-2 text-xs font-medium text-ink-900">
            <span className="inline-block w-3 h-[3px] rounded-full" style={{ background: SERIES.originalPrice.color }} />
            {SERIES.originalPrice.label}
        </span>
    </div>
);

const RetailerAnalyticsCard = () => {
    const { user } = useContext(AuthContext);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [data, setData] = useState(null);
    const [targetProfitPercentage, setTargetProfitPercentage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchAnalytics = () => {
        setLoading(true);
        setError('');
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        fetch(`/api/retailer-dashboard?${params.toString()}`, {
            headers: { Authorization: `Bearer ${user?.token}` }
        })
            .then((res) => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then((json) => {
                setData(json.data || []);
                setTargetProfitPercentage(json.targetProfitPercentage ?? null);
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchAnalytics();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const showSellingPrice = targetProfitPercentage != null;

    return (
        <div className="max-w-3xl">
            <h2 className="text-xl font-semibold text-ink-900 mb-2">Order Analytics</h2>
            <p className="text-sm text-muted mb-1">
                Filter your order history by date range. Selling price is what you'd paid plus the
                target margin you set on the Pricing Settings page.
            </p>
            <p className="text-xs text-amber-700 mb-6">
                Spend figures use current product pricing, not price at time of purchase (not tracked by the order record).
            </p>

            <div className="flex flex-wrap items-end gap-3 mb-6">
                <div>
                    <label className="block text-xs text-muted mb-1">Start date</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 border border-hairline rounded-lg text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs text-muted mb-1">End date</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="px-3 py-2 border border-hairline rounded-lg text-sm"
                    />
                </div>
                <button
                    onClick={fetchAnalytics}
                    disabled={loading}
                    className="px-4 py-2 bg-ink-900 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition disabled:opacity-50"
                >
                    {loading ? 'Loading...' : 'Fetch'}
                </button>
            </div>

            {error && <p className="text-sm text-red-600 mb-4">Error: {error}</p>}

            {!loading && data && data.length === 0 && !error && (
                <p className="text-sm text-muted">No orders found for this range.</p>
            )}

            {!loading && !showSellingPrice && data && data.length > 0 && (
                <p className="text-sm text-amber-700 mb-4">
                    Set a target profit % on the Pricing Settings page to see your projected selling price.
                </p>
            )}

            {!loading && data && data.length > 0 && (
                <>
                    <div className="bg-white rounded-2xl border border-hairline p-6 mb-6">
                        <LegendRow showSellingPrice={showSellingPrice} />
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#eceee5" />
                                    <XAxis
                                        dataKey="date"
                                        tick={{ fontSize: 12, fill: '#8a9088' }}
                                        axisLine={{ stroke: '#eceee5' }}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        tick={{ fontSize: 12, fill: '#8a9088' }}
                                        axisLine={false}
                                        tickLine={false}
                                        tickFormatter={(v) => `$${v}`}
                                        width={50}
                                    />
                                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d8dcd2', strokeWidth: 1 }} />
                                    <Line
                                        type="linear"
                                        dataKey="originalPrice"
                                        stroke={SERIES.originalPrice.color}
                                        strokeWidth={2.5}
                                        dot={{ r: 4, fill: SERIES.originalPrice.color, strokeWidth: 0 }}
                                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                    />
                                    {showSellingPrice && (
                                        <Line
                                            type="linear"
                                            dataKey="sellingPrice"
                                            stroke={SERIES.sellingPrice.color}
                                            strokeWidth={2.5}
                                            dot={{ r: 4, fill: SERIES.sellingPrice.color, strokeWidth: 0 }}
                                            activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff' }}
                                        />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        {data.map((row) => (
                            <div
                                key={row.date}
                                className="flex items-center justify-between px-4 py-2.5 bg-white rounded-lg border border-hairline text-sm"
                            >
                                <span className="text-muted">{row.date}</span>
                                <span>{row.ordersCount} orders</span>
                                <span>{row.unitsPurchased} units</span>
                                <span className="font-semibold">${row.totalSpend.toFixed(2)} paid</span>
                                {row.sellingPrice != null && (
                                    <span className="text-[#c97b3e] font-semibold">${row.sellingPrice.toFixed(2)} selling price</span>
                                )}
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default RetailerAnalyticsCard;