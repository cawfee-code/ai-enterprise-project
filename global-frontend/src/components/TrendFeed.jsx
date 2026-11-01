import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = { Positive: '#84cc16', Neutral: '#9ca3af', Negative: '#ef4444' };

const TrendFeed = () => {
    const [trends, setTrends] = useState([]);

    useEffect(() => {
        fetch('/api/trends')
            .then(res => res.json())
            .then(data => setTrends(data.data || []))
            .catch(err => console.error(err));
    }, []);

    // Aggregate NLP data for the Pie Chart weighted by market volume
    const sentimentCounts = trends.reduce((acc, trend) => {
        const score = trend.sentiment?.score || 'Neutral';
        acc[score] = (acc[score] || 0) + (trend.volume || 1);
        return acc;
    }, {});

    const pieData = Object.keys(sentimentCounts).map(key => ({
        name: key,
        value: sentimentCounts[key]
    }));

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-sage-200 mb-8">
            <h2 className="text-xl font-bold text-olive-900 mb-6">Real-Time Market Demand (AI)</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
                {/* Market Volume Pie Chart */}
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie 
                                data={pieData} dataKey="value" nameKey="name" 
                                cx="50%" cy="50%" outerRadius={80} 
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
                                ))}
                            </Pie>
                            <Tooltip formatter={(value) => `Vol: ${value.toLocaleString()}`} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Extracted Product Signals & Confidence Gauges */}
                <div className="overflow-y-auto h-64 pr-2">
                    {trends.map(trend => {
                        const score = trend.sentiment?.score;
                        const recommendation = score === 'Positive' ? '🟢 High Demand - Safe to Source/Manufacture' : 
                                               score === 'Negative' ? '🔴 Dead Trend - Do Not Stock' : 
                                               '⚪ Monitor Market';

                        // Defaults to the hashtag if the NLP engine hasn't extracted the specific item yet
                        const displayItem = trend.extractedItem || trend.hashtag;

                        return (
                            <div key={trend._id} className="mb-4 p-4 bg-sage-50 rounded-xl border border-sage-100">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-extrabold text-lg text-gray-900 capitalize">
                                            📦 {displayItem.replace('#', '')}
                                        </h3>
                                        <p className="text-xs text-purple-600 font-medium mt-1">
                                            Trigger: {trend.hashtag} | Source: {trend.source}
                                        </p>
                                    </div>
                                    <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-1 rounded">
                                        Vol: {trend.volume?.toLocaleString()}
                                    </span>
                                </div>
                                
                                <div className="text-xs font-bold mb-3 text-gray-700">{recommendation}</div>
                                
                                <div className="flex items-center gap-3">
                                    <span className={`text-sm font-semibold w-16 ${score === 'Positive' ? 'text-lime-600' : score === 'Negative' ? 'text-red-600' : 'text-gray-600'}`}>
                                        {score || 'Pending'}
                                    </span>
                                    <div className="flex-grow h-2.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-purple-500 transition-all duration-500" 
                                            style={{ width: `${(trend.sentiment?.confidence || 0) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-xs text-gray-400 font-medium">
                                        {((trend.sentiment?.confidence || 0) * 100).toFixed(0)}%
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default TrendFeed;