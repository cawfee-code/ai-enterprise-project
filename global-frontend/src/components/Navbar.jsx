import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import useCartStore from '../store/useCartStore';

const Navbar = ({ onLoginAsRetailer, onLoginAsManufacturer }) => {
    const { user, logout } = useContext(AuthContext);
    const cart = useCartStore((state) => state.cart);
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <nav className="bg-forest-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <div className="flex items-center gap-2.5 font-bold text-lg text-white tracking-tight">
                        <span className="inline-grid place-items-center w-7 h-7 rounded-md bg-accent-lime text-forest-900 text-sm">
                            ↗
                        </span>
                        AI ENTERPRISE
                    </div>

                    {!user && (
                        <div className="hidden md:flex items-center gap-8 text-sm text-[#a9bdb1]">
                            <span>Platform</span>
                            <span>How it works</span>
                            <span>For businesses</span>
                        </div>
                    )}

                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                {user.role === 'retailer' && (
                                    <div className="flex items-center gap-2 text-white">
                                        <span className="text-sm">Cart</span>
                                        <span className="bg-accent-lime text-ink-900 px-2.5 py-1 rounded-full text-xs font-bold">
                                            {cartCount}
                                        </span>
                                    </div>
                                )}
                                <span className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-white capitalize">
                                    {user.role}
                                </span>
                                <button
                                    onClick={logout}
                                    className="px-5 py-2 bg-accent-lime text-ink-900 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                                >
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={() => onLoginAsRetailer?.()}
                                    className="px-5 py-2 border border-white/30 text-white rounded-lg text-sm font-semibold hover:bg-white/5 transition"
                                >
                                    Log in
                                </button>
                                <button
                                    onClick={() => onLoginAsRetailer?.()}
                                    className="px-5 py-2 bg-accent-lime text-ink-900 rounded-lg text-sm font-semibold hover:opacity-90 transition"
                                >
                                    Get started ↗
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;