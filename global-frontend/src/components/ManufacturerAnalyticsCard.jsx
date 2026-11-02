import { useEffect, useState, useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';

const CLUSTER_COLORS = {
    'VIP': '#84cc16',         
    'Regular': '#3b82f6',     
    'Churn Risk': '#ef4444',  
    'Unassigned': '#9ca3af'   
};

const SENTIMENT_COLORS = {
    'Positive': '#84cc16',
    'Neutral': '#9ca3af',
    'Negative': '#ef4444'
};

const ManufacturerAnalyticsCard = () => {
    const { user } = useContext(AuthContext);
    const [metrics, setMetrics] = useState({ salesTimeline: [], audienceSegments: [], marketSignals: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // useCallback ensures the event listener always executes with the latest state context
    const fetchDashboardData = useCallback(async () => {
        try {
            const token = user?.token || localStorage.getItem('token'); 
            const res = await fetch('http://localhost:5000/api/dashboard/summary', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch metrics');
            
            setMetrics(data.dashboard);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]); 

    useEffect(() => {
        fetchDashboardData();
        
        // Rock-solid event bridge
        window.addEventListener('dashboardSync', fetchDashboardData);
        return () => window.removeEventListener('dashboardSync', fetchDashboardData);
    }, [fetchDashboardData]);

    if (loading) return <div className="p-8 text-gray-500 animate-pulse">Crunching aggregation pipelines...</div>;
    if (error) return <div className="p-8 text-red-500 font-semibold">Error: {error}</div>;

    return (
        <div className="space-y-8 mt-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-sage-200">
                    <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">30-Day Revenue</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={metrics.salesTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#9ca3af" />
                                <YAxis tick={{fontSize: 12}} stroke="#9ca3af" tickFormatter={(value) => `$${value}`} />
                                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                                <Area type="monotone" dataKey="dailyRevenue" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-sage-200">
                    <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Retailer Segments</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={metrics.audienceSegments} 
                                    dataKey="count" 
                                    nameKey="segment" 
                                    cx="50%" cy="50%" 
                                    innerRadius={60} outerRadius={80} 
                                    label={({ segment, percent }) => `${segment} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {metrics.audienceSegments.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[entry.segment] || CLUSTER_COLORS['Unassigned']} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => [value, 'Retailers']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-sage-200">
                <h3 className="text-sm font-bold text-gray-500 mb-4 uppercase tracking-wider">Top NLP Market Signals</h3>
                <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={metrics.marketSignals} layout="vertical" margin={{ top: 0, right: 20, left: 40, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f3f4f6" />
                            <XAxis type="number" hide />
                            <YAxis type="category" dataKey="hashtag" tick={{fontSize: 12, fontWeight: 600}} stroke="#4b5563" axisLine={false} tickLine={false} />
                            <Tooltip cursor={{fill: '#f9fafb'}} />
                            <Legend />
                            <Bar dataKey="volume" name="Trend Volume" radius={[0, 4, 4, 0]} maxBarSize={40}>
                                {metrics.marketSignals.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={SENTIMENT_COLORS[entry.sentiment?.score] || SENTIMENT_COLORS['Neutral']} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default ManufacturerAnalyticsCard;