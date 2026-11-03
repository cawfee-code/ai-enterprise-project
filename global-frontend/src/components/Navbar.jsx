import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import useCartStore from '../store/useCartStore';

const Navbar = ({ onLoginAsRetailer, onLoginAsManufacturer, onGoHome }) => {
    const { user, logout } = useContext(AuthContext);
    const cart = useCartStore((state) => state.cart);
    const removeFromCart = useCartStore((state) => state.removeFromCart);
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const cartTotal = cart.reduce((total, item) => total + item.quantity * (item.price || 0), 0);
    const [isCartOpen, setIsCartOpen] = useState(false);

    return (
        <nav className="bg-forest-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-20 items-center">
                    <button
                        onClick={() => onGoHome?.()}
                        className="flex items-center gap-2.5 font-bold text-lg text-white tracking-tight"
                    >
                        <span className="inline-grid place-items-center w-7 h-7 rounded-md bg-accent-lime text-forest-900 text-sm">↗</span>
                        AI ENTERPRISE
                    </button>
                    {!user && (
                        <div className="hidden md:flex items-center gap-8 text-sm text-[#a9bdb1]">
                            <span>Platform</span><span>How it works</span><span>For businesses</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                        {user ? (
                            <>
                                {user.role === 'retailer' && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setIsCartOpen((open) => !open)}
                                            className="flex items-center gap-2 text-white"
                                        >
                                            <span className="text-sm">Cart</span>
                                            <span className="bg-accent-lime text-ink-900 px-2.5 py-1 rounded-full text-xs font-bold">{cartCount}</span>
                                        </button>

                                        {isCartOpen && (
                                            <div className="absolute right-0 mt-3 w-80 bg-white rounded-xl shadow-lg border border-sage-200 p-4 text-ink-900 z-50">
                                                <h3 className="font-semibold text-sm mb-3">Your Cart</h3>

                                                {cart.length === 0 && (
                                                    <p className="text-xs text-gray-500">Your cart is empty.</p>
                                                )}

                                                {cart.length > 0 && (
                                                    <>
                                                        <div className="space-y-3 max-h-64 overflow-y-auto">
                                                            {cart.map((item) => (
                                                                <div key={item.productId} className="flex items-start justify-between gap-2">
                                                                    <div>
                                                                        <p className="text-sm font-medium">{item.name}</p>
                                                                        <p className="text-xs text-gray-500">
                                                                            Qty {item.quantity} &middot; ${item.price?.toFixed(2)} each
                                                                        </p>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-sm font-semibold">
                                                                            ${(item.quantity * (item.price || 0)).toFixed(2)}
                                                                        </p>
                                                                        <button
                                                                            onClick={() => removeFromCart(item.productId)}
                                                                            className="text-xs text-red-600 hover:underline"
                                                                        >
                                                                            Remove
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-sage-200">
                                                            <span className="text-sm font-semibold">Total</span>
                                                            <span className="text-sm font-semibold">${cartTotal.toFixed(2)}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <span className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-white capitalize">{user.role}</span>
                                <button onClick={logout} className="px-5 py-2 bg-accent-lime text-ink-900 rounded-lg text-sm font-semibold hover:opacity-90 transition">Log Out</button>
                            </>
                        ) : (
                            <>
                                <button onClick={() => onLoginAsRetailer?.()} className="px-5 py-2 border border-white/30 text-white rounded-lg text-sm font-semibold hover:bg-white/5 transition">Log in</button>
                                <button onClick={() => onLoginAsRetailer?.()} className="px-5 py-2 bg-accent-lime text-ink-900 rounded-lg text-sm font-semibold hover:opacity-90 transition">Get started ↗</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};
export default Navbar;