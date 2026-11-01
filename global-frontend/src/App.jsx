import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './context/AuthContext';
import Layout from './components/Layout';
import RegisterRetailerForm from './components/RegisterRetailerForm';
import LoginRetailerForm from './components/LoginRetailerForm';
import ResetPasswordRetailerForm from './components/ResetPasswordRetailerForm';
import RegisterManufacturerForm from './components/RegisterManufacturerForm';
import LoginManufacturerForm from './components/LoginManufacturerForm';
import ResetPasswordManufacturerForm from './components/ResetPasswordManufacturerForm';
import RoutingMap from './components/RoutingMap';
import RetailerDashboard from './components/RetailerDashboard';
import TrendFeed from './components/TrendFeed';

function App() {
    const { login, user } = useContext(AuthContext);
    const [portalMode, setPortalMode] = useState(null);
    const [retailerAuthMode, setRetailerAuthMode] = useState('login');
    const [manufacturerAuthMode, setManufacturerAuthMode] = useState('login');
    const [logistics, setLogistics] = useState(null);

    useEffect(() => {
        if (!user) setLogistics(null);
    }, [user]);

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
                <div>
                    <div className="bg-forest-900 rounded-3xl overflow-hidden mb-0">
                        <div className="grid md:grid-cols-2 gap-10 px-8 md:px-14 py-16 items-center">
                            <div>
                                <div className="text-accent-lime text-[11px] font-extrabold tracking-[0.17em] uppercase mb-6" style={{ fontFamily: 'var(--font-display)' }}>
                                    The new language of B2B commerce
                                </div>
                                <h1
                                    className="text-white font-semibold leading-[1.05] mb-6"
                                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(40px, 5vw, 70px)', letterSpacing: '-0.03em' }}
                                >
                                    Source better.<br />
                                    <span className="text-accent-lime">Move faster.</span><br />
                                    Grow together.
                                </h1>
                                <p className="text-[#b9c9c0] text-[15px] leading-relaxed max-w-md mb-8">
                                    A B2B marketplace connecting retailers and manufacturers — dynamic pricing, secure orders, and real-time inventory in one place.
                                </p>
                                <div className="flex flex-wrap gap-3">
                                    <button
                                        onClick={() => setPortalMode('retailer')}
                                        className="bg-accent-lime text-ink-900 font-semibold rounded-lg px-6 py-3 text-sm hover:opacity-90 transition"
                                    >
                                        Enter as a retailer ↗
                                    </button>
                                    <button
                                        onClick={() => setPortalMode('manufacturer')}
                                        className="border border-[#5c7768] text-white font-semibold rounded-lg px-6 py-3 text-sm hover:bg-white/5 transition"
                                    >
                                        I'm a manufacturer
                                    </button>
                                </div>
                            </div>

                            <div className="relative hidden md:block" style={{ height: 390 }}>
                                <div className="absolute inset-4 border border-[#55725f] rounded-full" style={{ transform: 'rotate(-20deg)' }} />

                                <div className="absolute bg-[#244638] border border-[#5b786a] rounded-xl p-4 shadow-xl text-white" style={{ width: 220, top: 10, left: 20, transform: 'rotate(-6deg)' }}>
                                    <div className="text-[10px] text-[#a6c0ae] mb-2">Discover</div>
                                    <div className="text-sm font-semibold">Products worth finding</div>
                                    <div className="h-1.5 bg-[#496654] rounded-full mt-3 overflow-hidden">
                                        <div className="h-full bg-accent-lime" style={{ width: '72%' }} />
                                    </div>
                                </div>

                                <div className="absolute bg-accent-lime rounded-xl p-4 shadow-xl text-ink-900" style={{ width: 215, right: -10, top: 140, transform: 'rotate(6deg)' }}>
                                    <div className="text-[10px] text-[#456343] mb-2">Connect</div>
                                    <div className="text-sm font-semibold">Retailers × Manufacturers</div>
                                    <div className="text-[11px] text-[#456343] mt-1">One shared ecosystem</div>
                                </div>

                                <div className="absolute bg-[#eff2e7] rounded-xl p-4 shadow-xl text-ink-900" style={{ width: 190, bottom: 0, left: 0, transform: 'rotate(-3deg)' }}>
                                    <div className="text-[10px] text-[#6f8576] mb-2">Manage</div>
                                    <div className="text-sm font-semibold">Built for real workflows</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex bg-accent-lime text-ink-900 px-8 md:px-14 py-4 justify-between flex-wrap gap-2 font-semibold text-sm">
                            <span>Discover products ↗</span>
                            <span className="opacity-80">Manage designs ↗</span>
                            <span className="opacity-80">Make informed decisions ↗</span>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 py-14">
                        <div>
                            <div className="text-muted text-sm mb-3">Two roles. One ecosystem.</div>
                            <h2 className="text-2xl md:text-3xl font-semibold text-ink-900 leading-snug mb-3">
                                Business moves better when everything connects.
                            </h2>
                            <p className="text-muted text-sm leading-relaxed max-w-sm">
                                We designed two clear entry points and one consistent experience — so each business can focus on its own work.
                            </p>
                        </div>
                        <div className="flex flex-col border border-hairline rounded-xl overflow-hidden">
                            <button
                                onClick={() => setPortalMode('retailer')}
                                className="flex items-center justify-between gap-4 p-6 bg-white hover:bg-gray-50 transition text-left border-b border-hairline"
                            >
                                <div>
                                    <div className="font-semibold text-ink-900 text-lg">I'm a retailer</div>
                                    <div className="text-sm text-muted mt-1">Discover catalogs and manage your sourcing workspace.</div>
                                </div>
                                <span className="bg-ink-900 text-white text-sm font-semibold rounded-lg px-4 py-2 whitespace-nowrap">Explore ↗</span>
                            </button>
                            <button
                                onClick={() => setPortalMode('manufacturer')}
                                className="flex items-center justify-between gap-4 p-6 bg-white hover:bg-gray-50 transition text-left"
                            >
                                <div>
                                    <div className="font-semibold text-ink-900 text-lg">I'm a manufacturer</div>
                                    <div className="text-sm text-muted mt-1">Join the B2B network with your manufacturing business.</div>
                                </div>
                                <span className="bg-ink-900 text-white text-sm font-semibold rounded-lg px-4 py-2 whitespace-nowrap">Join ↗</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {!user && portalMode === 'retailer' && (
                <div>
                    <button onClick={() => setPortalMode(null)} className="text-sm text-muted mb-6 underline">
                        ← Back to home
                    </button>

                    <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden border border-hairline">
                        <div className="bg-forest-900 p-10 flex flex-col justify-between min-h-[420px] relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="text-accent-lime text-[11px] font-extrabold tracking-[0.17em] uppercase mb-6">
                                    Retailer access
                                </div>
                                <h1
                                    className="text-white font-semibold leading-[1.05] mb-5"
                                    style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 4.5vw, 52px)', letterSpacing: '-0.02em' }}
                                >
                                    A better way<br />to <span className="text-accent-lime">source<br />what's next.</span>
                                </h1>
                                <p className="text-[#b9c9c0] text-sm leading-relaxed max-w-sm">
                                    One workspace to find products, manage designs and make confident retail decisions.
                                </p>
                            </div>
                            <svg className="absolute bottom-6 right-6 opacity-30" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#3c5a4c" strokeWidth="1.5">
                                <path d="M7 17L17 7M17 7H9M17 7V15" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="text-xs text-[#6f8c7c] relative z-10">Designed for business. Built for momentum.</div>
                        </div>

                        <div className="bg-white p-10 flex flex-col justify-center">
                            <div className="max-w-sm w-full mx-auto">
                                    <div className="flex rounded-lg overflow-hidden border border-hairline mb-7">
                                    <button
                                        onClick={() => setPortalMode('retailer')}
                                        className="flex-1 py-2.5 text-sm font-semibold bg-white text-ink-900"
                                    >
                                        Retailer
                                    </button>
                                    <button
                                        onClick={() => setPortalMode('manufacturer')}
                                        className="flex-1 py-2.5 text-sm font-medium bg-paper text-muted hover:text-ink-900 transition"
                                    >
                                        Manufacturer
                                    </button>
                                </div>

                                {retailerAuthMode === 'login' && <LoginRetailerForm onSuccess={login} />}
                                {retailerAuthMode === 'register' && (
                                    <RegisterRetailerForm onSuccess={() => setRetailerAuthMode('login')} />
                                )}
                                {retailerAuthMode === 'reset' && (
                                    <ResetPasswordRetailerForm onSuccess={() => setRetailerAuthMode('login')} />
                                )}

                                <p className="text-sm text-muted mt-5 text-center">
                                    {retailerAuthMode === 'login' && (
                                        <>
                                            New retailer?{' '}
                                            <button onClick={() => setRetailerAuthMode('register')} className="text-ink-900 font-semibold underline">
                                                Create an account
                                            </button>
                                            {' '}&middot;{' '}
                                            <button onClick={() => setRetailerAuthMode('reset')} className="text-ink-900 font-semibold underline">
                                                Forgot password?
                                            </button>
                                        </>
                                    )}
                                    {retailerAuthMode !== 'login' && (
                                        <>
                                            Back to{' '}
                                            <button onClick={() => setRetailerAuthMode('login')} className="text-ink-900 font-semibold underline">
                                                Log in
                                            </button>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {!user && portalMode === 'manufacturer' && (
                <div>
                    <button onClick={() => setPortalMode(null)} className="text-sm text-muted mb-6 underline">
                        ← Back to home
                    </button>

                    <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden border border-hairline">
                        <div className="bg-plum-900 p-10 flex flex-col justify-between min-h-[420px] relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="text-accent-violet text-[11px] font-extrabold tracking-[0.17em] uppercase mb-6">
                                    Manufacturer access
                                </div>
                                {manufacturerAuthMode === 'register' ? (
                                    <>
                                        <h1
                                            className="text-white font-semibold leading-[1.05] mb-5"
                                            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 4.5vw, 52px)', letterSpacing: '-0.02em' }}
                                        >
                                            Your next<br /><span className="text-accent-lime">business<br />connection.</span>
                                        </h1>
                                        <p className="text-[#b9c9c0] text-sm leading-relaxed max-w-sm">
                                            Create or access your account to join a connected B2B manufacturing network.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <h1
                                            className="text-white font-semibold leading-[1.05] mb-5"
                                            style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 4.5vw, 52px)', letterSpacing: '-0.02em' }}
                                        >
                                            Reach retailers<br /><span className="text-accent-violet">ready to<br />order.</span>
                                        </h1>
                                        <p className="text-[#b9c9c0] text-sm leading-relaxed max-w-sm">
                                            List your catalog, manage pricing, and fulfill orders from one connected workspace.
                                        </p>
                                    </>
                                )}
                            </div>
                            <svg className="absolute bottom-6 right-6 opacity-30" width="90" height="90" viewBox="0 0 24 24" fill="none" stroke="#2f7a4d" strokeWidth="1.5">
                                <path d="M7 17L17 7M17 7H9M17 7V15" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            <div className="text-xs text-[#6f8c7c] relative z-10">Designed for business. Built for momentum.</div>
                        </div>

                        <div className="bg-white p-10 flex flex-col justify-center">
                            <div className="max-w-sm w-full mx-auto">
                                    <div className="flex rounded-lg overflow-hidden border border-hairline mb-7">
                                    <button
                                        onClick={() => setPortalMode('retailer')}
                                        className="flex-1 py-2.5 text-sm font-medium bg-paper text-muted hover:text-ink-900 transition"
                                    >
                                        Retailer
                                    </button>
                                    <button
                                        onClick={() => setPortalMode('manufacturer')}
                                        className="flex-1 py-2.5 text-sm font-semibold bg-white text-ink-900"
                                    >
                                        Manufacturer
                                    </button>
                                </div>
                                {manufacturerAuthMode === 'login' && <LoginManufacturerForm onSuccess={login} />}
                                {manufacturerAuthMode === 'register' && (
                                    <RegisterManufacturerForm onSuccess={() => setManufacturerAuthMode('login')} />
                                )}
                                {manufacturerAuthMode === 'reset' && (
                                    <ResetPasswordManufacturerForm onSuccess={() => setManufacturerAuthMode('login')} />
                                )}

                                <p className="text-sm text-muted mt-5 text-center">
                                    {manufacturerAuthMode === 'login' && (
                                        <>
                                            New manufacturer?{' '}
                                            <button onClick={() => setManufacturerAuthMode('register')} className="text-ink-900 font-semibold underline">
                                                Create an account
                                            </button>
                                            {' '}&middot;{' '}
                                            <button onClick={() => setManufacturerAuthMode('reset')} className="text-ink-900 font-semibold underline">
                                                Forgot password?
                                            </button>
                                        </>
                                    )}
                                    {manufacturerAuthMode !== 'login' && (
                                        <>
                                            Back to{' '}
                                            <button onClick={() => setManufacturerAuthMode('login')} className="text-ink-900 font-semibold underline">
                                                Log in
                                            </button>
                                        </>
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

                        {user?.role === 'retailer' && (
                <div className="font-playfair max-w-5xl mx-auto">
                    
                    {/* Trend Feed is now securely inside the Retailer Dashboard */}
                    <TrendFeed/>

                    {logistics && <RoutingMap logistics={logistics} />}

                    <RetailerDashboard onSimulateBulkOrder={simulateBulkOrder} />

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