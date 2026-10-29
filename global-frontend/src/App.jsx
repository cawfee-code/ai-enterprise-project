import { useContext } from 'react';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';

function App() {
    const { login } = useContext(AuthContext);

    return (
        <Layout>
            <div className="bg-white rounded-xl shadow-sm border p-8 text-center max-w-2xl mx-auto mt-10">
                <h1 className="text-2xl font-bold text-gray-800 mb-4">Architecture Simulation Interface</h1>
                <p className="text-gray-600 mb-8">
                    Use these buttons to simulate logins and watch the global Navbar react instantly via the AuthContext.
                </p>
                
                <div className="flex justify-center gap-4">
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
            </div>
        </Layout>
    );
}

export default App;