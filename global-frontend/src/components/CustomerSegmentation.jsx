import { useEffect, useState, useContext } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AuthContext } from '../context/AuthContext';

const CLUSTER_COLORS = {
    'VIP': '#84cc16',         
    'Regular': '#3b82f6',     
    'Churn Risk': '#ef4444',  
    'Unassigned': '#9ca3af'   
};

const CustomerSegmentation = () => {
    const { user } = useContext(AuthContext);
    const [customers, setCustomers] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    const fetchCustomers = () => {
        const token = localStorage.getItem('token') || user?.token;
        
        fetch('http://localhost:5000/api/customers?limit=100', {
            headers: { 'Authorization': `Bearer ${token}` }
        })
        .then(res => {
            if (!res.ok) throw new Error(`HTTP status ${res.status}`);
            return res.json();
        })
        .then(data => setCustomers(data.data || []))
        .catch(err => console.error("Customer Fetch Error:", err));
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const triggerClustering = async () => {
        setIsProcessing(true);
        try {
            await fetch('http://localhost:8000/cluster-customers', { method: 'POST' });
            fetchCustomers(); 
        } catch (err) {
            console.error("Clustering Error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    const generateMockData = async () => {
        setIsProcessing(true);
        try {
            await fetch('http://localhost:5000/api/internal/simulate-data', { method: 'POST' });
            await fetch('http://localhost:8000/cluster-customers', { method: 'POST' });
            fetchCustomers();
        } catch (err) {
            console.error("Simulation Error:", err);
        } finally {
            setIsProcessing(false);
        }
    };

    const scatterData = customers.map(c => ({
        x: c.aiCluster?.totalSpent || 0,
        y: c.aiCluster?.orderFrequency || 0,
        segment: c.aiCluster?.segmentName || 'Unassigned',
        email: c.email
    }));

    return (
        <div className="p-6 bg-white rounded-2xl shadow-sm border border-sage-200 mb-8 mt-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-olive-900">AI Customer Segmentation</h2>
                <div className="flex gap-4">
                    <button 
                        onClick={generateMockData}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-bold rounded hover:bg-gray-300 transition disabled:opacity-50"
                    >
                        Simulate History
                    </button>
                    <button 
                        onClick={triggerClustering}
                        disabled={isProcessing}
                        className="px-4 py-2 bg-purple-600 text-white text-sm font-bold rounded hover:bg-purple-700 transition disabled:opacity-50"
                    >
                        {isProcessing ? 'Processing...' : 'Run Clustering'}
                    </button>
                </div>
            </div>
            
            <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid />
                        <XAxis type="number" dataKey="x" name="Total Spent ($)" unit="$" />
                        <YAxis type="number" dataKey="y" name="Orders" />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Customers" data={scatterData}>
                            {scatterData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={CLUSTER_COLORS[entry.segment]} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default CustomerSegmentation;