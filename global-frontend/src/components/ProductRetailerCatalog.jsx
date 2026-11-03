import { useEffect, useState } from 'react';
import { fetchProducts } from '../api/productRetailerApi';
import useCartStore from '../store/useCartStore';

const getInitials = (name) => {
    if (!name) return '--';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
};

const ProductRetailerCatalog = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const addToCart = useCartStore((state) => state.addToCart);
    const cart = useCartStore((state) => state.cart);

    useEffect(() => {
        fetchProducts()
            .then(setProducts)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-ink-900">Product Catalog</h2>
                <p className="text-sm text-muted mt-1">Browse available inventory from manufacturers and add items to your cart.</p>
            </div>

            {loading && <p className="text-sm text-muted">Loading products...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && products.length === 0 && (
                <p className="text-sm text-muted">No products available yet.</p>
            )}

            {!loading && !error && products.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {products.map((product) => {
                        const inCart = cart.find((item) => item.productId === product._id)?.quantity || 0;
                        const remaining = product.stockCount - inCart;
                        const lowStock = remaining > 0 && remaining <= 10;

                        return (
                            <div
                                key={product._id}
                                className="bg-white rounded-xl border border-hairline p-4 flex flex-col transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-lg bg-[#eef3e6] text-[#3c5a44] flex items-center justify-center font-bold text-sm">
                                        {getInitials(product.name)}
                                    </div>
                                    {lowStock && (
                                        <span className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-0.5">
                                            Low stock · {remaining} left
                                        </span>
                                    )}
                                    {remaining <= 0 && (
                                        <span className="text-[11px] font-medium text-muted bg-[#f1f3ec] rounded-full px-2.5 py-0.5">
                                            Out of stock
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-semibold text-ink-900 text-[15px]">{product.name}</h3>
                                <p className="text-[11px] text-muted mt-0.5">
                                    by {product.manufacturerId?.businessName || product.manufacturerId?.email || 'Unknown manufacturer'}
                                </p>
                                <p className="text-xs text-muted mt-1 mb-4 line-clamp-2 flex-grow">{product.description}</p>

                                <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-ink-900">
                                        ${product.price?.toFixed(2)}
                                    </span>
                                    <button
                                        onClick={() =>
                                            addToCart({
                                                productId: product._id,
                                                name: product.name,
                                                quantity: 1,
                                                price: product.price,
                                            })
                                        }
                                        disabled={remaining <= 0}
                                        className="bg-ink-900 hover:opacity-90 text-accent-lime font-semibold text-xs rounded-lg px-4 py-2 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {remaining <= 0 ? 'Out of Stock' : 'Add to cart'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ProductRetailerCatalog;