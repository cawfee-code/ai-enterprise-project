import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import useCartStore from './store/useCartStore'; // 1. Import the store

function App() {
    const { login, user } = useContext(AuthContext);
    const addToCart = useCartStore((state) => state.addToCart); // 2. Pull the action

    return (
        <Layout>
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center max-w-2xl mx-auto mt-10">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Architecture Simulation Interface</h1>
                
                <div className="flex justify-center gap-4 mb-8">
                    <button 
                        onClick={() => login({ role: 'retailer', token: 'dummy_123' })}
                        className="px-6 py-2 bg-green-600 text-white rounded shadow hover:bg-green-700 transition"
                    >
                        Simulate Retailer
                    </button>
                    <button 
                        onClick={() => login({ role: 'manufacturer', token: 'dummy_456' })}
                        className="px-6 py-2 bg-purple-600 text-white rounded shadow hover:bg-purple-700 transition"
                    >
                        Simulate Manufacturer
                    </button>
                </div>

                {/* Only show Add to Cart if logged in as a Retailer */}
                {user?.role === 'retailer' && (
                    <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                        <h2 className="text-lg font-semibold text-blue-900 mb-4">Retailer Controls</h2>
                        <button 
                            onClick={() => addToCart({ productId: 'widget_1', name: 'Industrial Widget', quantity: 1, price: 299.99 })}
                            className="px-6 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
                        >
                            + Add Item to Global Cart
                        </button>
                    </div>
                )}
            </div>
        </Layout>
    );
}

export default App;