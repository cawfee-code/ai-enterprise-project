import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import useCartStore from '../store/useCartStore';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const cart = useCartStore((state) => state.cart);
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

    return (
        <nav className="bg-white/60 backdrop-blur-md border-b border-white/40">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <div className="flex-shrink-0 font-bold text-xl text-olive-900 tracking-tight">
                        AI Enterprise
                    </div>

                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                {user.role === 'retailer' && (
                                    <div className="flex items-center gap-2 text-olive-900">
                                        <span className="text-sm">Cart</span>
                                        <span className="bg-lime-400 text-olive-900 px-2.5 py-1 rounded-full text-xs font-bold">
                                            {cartCount}
                                        </span>
                                    </div>
                                )}
                                <span className="px-3 py-1.5 bg-sage-100 rounded-full text-sm text-olive-900 capitalize">
                                    {user.role}
                                </span>
                                <button
                                    onClick={logout}
                                    className="px-5 py-2 bg-olive-900 text-white rounded-full text-sm font-medium hover:opacity-90 transition"
                                >
                                    Log Out
                                </button>
                            </>
                        ) : (
                            <span className="px-5 py-2 bg-lime-400 text-olive-900 rounded-full text-sm font-semibold">
                                Not Logged In
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;