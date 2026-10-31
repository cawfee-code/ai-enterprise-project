import { useContext, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import RegisterRetailerForm from './components/RegisterRetailerForm';
import LoginRetailerForm from './components/LoginRetailerForm';
import ResetPasswordRetailerForm from './components/ResetPasswordRetailerForm';
import RegisterManufacturerForm from './components/RegisterManufacturerForm';
import LoginManufacturerForm from './components/LoginManufacturerForm';
import ResetPasswordManufacturerForm from './components/ResetPasswordManufacturerForm';
import RoutingMap from './components/RoutingMap';
import heroIllustration from './assets/heroIllustration.png';
import manufacturerIllustration from './assets/Illustration2.png';
import RetailerDashboard from './components/RetailerDashboard';

function App() {
    const { login, user } = useContext(AuthContext);
    const [portalMode, setPortalMode] = useState(null);
    const [retailerAuthMode, setRetailerAuthMode] = useState('login');
    const [manufacturerAuthMode, setManufacturerAuthMode] = useState('login');
    const [logistics, setLogistics] = useState(null);

    const bgTheme = portalMode === 'manufacturer' || user?.role === 'manufacturer' ? 'manufacturer' :
    portalMode === 'retailer' || user?.role === 'retailer' ? 'retailer' : 'mixed';

    const simulateBulkOrder = () => {
        setLogistics({
            routeType: 'bulk_qc_routing',
            origin: { coordinates: [-122.4194, 37.7749], address: "SF Factory" },
            destination: { coordinates: [-74.0060, 40.7128], address: "NY Retailer QC Hub" }
        });
    };

    return (
        <Layout
            theme={bgTheme}
            onLoginAsRetailer={() => setPortalMode('retailer')}
            onLoginAsManufacturer={() => setPortalMode('manufacturer')}
        >
            {!user && portalMode === null && (
                <div className="text-center py-16">
                    <h1 className="text-3xl md:text-4xl font-extrabold text-olive-900 tracking-tight mb-3">
                        RUN YOUR STORE EVERYWHERE.
                    </h1>
                    <p className="text-gray-600 max-w-xl mx-auto mb-10">
                        A B2B marketplace connecting retailers and manufacturers —
                        dynamic pricing, secure orders, and real-time inventory in one place.
                    </p>

                    <div className="flex justify-center gap-6">
                        <button
                            onClick={() => setPortalMode('retailer')}
                            className="w-40 bg-white rounded-3xl shadow-sm border border-sage-200 p-6 flex flex-col items-center gap-3 hover:shadow-md transition"
                        >
                            <div className="w-14 h-14 bg-lime-400 rounded-2xl flex items-center justify-center text-2xl">
                                🏬
                            </div>
                            <span className="text-olive-900 font-semibold text-center text-sm">
                                Login as Retailer
                            </span>
                        </button>

                        <button
                            onClick={() => setPortalMode('manufacturer')}
                            className="w-40 bg-white rounded-3xl shadow-sm border border-sage-200 p-6 flex flex-col items-center gap-3 hover:shadow-md transition"
                        >
                            <div className="w-14 h-14 bg-purple-600 rounded-2xl flex items-center justify-center text-2xl">
                                🏭
                            </div>
                            <span className="text-olive-900 font-semibold text-center text-sm">
                                Login as Manufacturer
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {!user && portalMode === 'retailer' && (
                <div>
                    <button onClick={() => setPortalMode(null)} className="text-sm text-gray-500 mb-6 underline">
                        ← Back to Home
                    </button>

                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div className="hidden md:flex justify-center">
                            <img
                                src={heroIllustration}
                                alt="Retailer and manufacturer connected through an AI-driven supply chain"
                                className="w-full max-w-xs fade-edges"
                            />
                        </div>

                        <div>
                            {retailerAuthMode === 'login' && <LoginRetailerForm onSuccess={login} />}
                            {retailerAuthMode === 'register' && (
                                <RegisterRetailerForm onSuccess={() => setRetailerAuthMode('login')} />
                            )}
                            {retailerAuthMode === 'reset' && (
                                <ResetPasswordRetailerForm onSuccess={() => setRetailerAuthMode('login')} />
                            )}

                            <p className="text-sm text-gray-500 mt-4 text-center">
                                {retailerAuthMode === 'login' && (
                                    <>
                                        New retailer?{' '}
                                        <button onClick={() => setRetailerAuthMode('register')} className="text-olive-900 font-semibold underline">
                                            Create an account
                                        </button>
                                        {' '}&middot;{' '}
                                        <button onClick={() => setRetailerAuthMode('reset')} className="text-olive-900 font-semibold underline">
                                            Forgot password?
                                        </button>
                                    </>
                                )}
                                {retailerAuthMode !== 'login' && (
                                    <>
                                        Back to{' '}
                                        <button onClick={() => setRetailerAuthMode('login')} className="text-olive-900 font-semibold underline">
                                            Log in
                                        </button>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-olive-900 tracking-tight mb-3">
                            RUN YOUR STORE EVERYWHERE.
                        </h1>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            A B2B marketplace connecting retailers and manufacturers —
                            dynamic pricing, secure orders, and real-time inventory in one place.
                        </p>
                    </div>
                </div>
            )}

            {!user && portalMode === 'manufacturer' && (
                <div>
                    <button onClick={() => setPortalMode(null)} className="text-sm text-gray-500 mb-6 underline">
                        ← Back to Home
                    </button>

                    <div className="grid md:grid-cols-2 gap-10 items-center">
                        <div className="hidden md:flex justify-center">
                            <img
                                src={manufacturerIllustration}
                                alt="Manufacturer production and fulfillment illustration"
                                className="w-full max-w-xs fade-edges"
                            />
                        </div>

                        <div>
                            {manufacturerAuthMode === 'login' && <LoginManufacturerForm onSuccess={login} />}
                            {manufacturerAuthMode === 'register' && (
                                <RegisterManufacturerForm onSuccess={() => setManufacturerAuthMode('login')} />
                            )}
                            {manufacturerAuthMode === 'reset' && (
                                <ResetPasswordManufacturerForm onSuccess={() => setManufacturerAuthMode('login')} />
                            )}

                            <p className="text-sm text-gray-500 mt-4 text-center">
                                {manufacturerAuthMode === 'login' && (
                                    <>
                                        New manufacturer?{' '}
                                        <button onClick={() => setManufacturerAuthMode('register')} className="text-olive-900 font-semibold underline">
                                            Create an account
                                        </button>
                                        {' '}&middot;{' '}
                                        <button onClick={() => setManufacturerAuthMode('reset')} className="text-olive-900 font-semibold underline">
                                            Forgot password?
                                        </button>
                                    </>
                                )}
                                {manufacturerAuthMode !== 'login' && (
                                    <>
                                        Back to{' '}
                                        <button onClick={() => setManufacturerAuthMode('login')} className="text-olive-900 font-semibold underline">
                                            Log in
                                        </button>
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="text-center mt-6">
                        <h1 className="text-3xl md:text-4xl font-extrabold text-olive-900 tracking-tight mb-3">
                            RUN YOUR STORE EVERYWHERE.
                        </h1>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            A B2B marketplace connecting retailers and manufacturers —
                            dynamic pricing, secure orders, and real-time inventory in one place.
                        </p>
                    </div>
                </div>
            )}

            {user?.role === 'retailer' && (
                <div className="font-playfair max-w-5xl mx-auto">
                    
                    <button 
                        onClick={simulateBulkOrder}
                        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                        Simulate Bulk Order Placement
                    </button>
                    
                    {logistics && <RoutingMap logistics={logistics} />}

                    <RetailerDashboard />

                </div>
            )}

            {user?.role === 'manufacturer' && (
                <div className="bg-white rounded-3xl shadow-lg border border-sage-200 p-8 max-w-md mx-auto text-center">
                    <h2 className="text-lg font-semibold text-olive-900 mb-2">Manufacturer Portal</h2>
                    <p className="text-gray-500 text-sm">
                        Dashboard not built yet — this is Shouvik & Rohon's scope.
                    </p>
                </div>
            )}
        </Layout>
    );
}

export default App;