import { useEffect, useState } from 'react';
import { fetchProducts } from '../api/productRetailerApi';
import useCartStore from '../store/useCartStore';

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
                <h2 className="text-3xl font-semibold text-olive-900">Product Catalog</h2>
                <p className="text-sm text-gray-500 mt-1">Stock from your connected manufacturers, ready to order</p>
            </div>

            {loading && <p className="text-sm text-gray-500">Loading products...</p>}
            {error && <p className="text-sm text-red-600">{error}</p>}
            {!loading && !error && products.length === 0 && (
                <p className="text-sm text-gray-500">No products available yet.</p>
            )}

            {!loading && !error && products.length > 0 && (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {products.map((product) => {
                        const inCart = cart.find((item) => item.productId === product._id)?.quantity || 0;
                        const remaining = product.stockCount - inCart;
                        const lowStock = remaining > 0 && remaining <= 10;

                        return (
                            <div
                                key={product._id}
                                className="bg-white rounded-2xl border border-sage-200 overflow-hidden flex flex-col transition hover:-translate-y-0.5 hover:shadow-md"
                            >
                                <div className="px-5 pt-5">
                                    <h3 className="font-semibold text-olive-900 text-lg">{product.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.description}</p>
                                </div>

                                <div className="px-5 mt-4 flex items-center justify-between">
                                    <span className="text-2xl font-semibold text-olive-900">
                                        ${product.price?.toFixed(2)}
                                    </span>
                                    {lowStock && (
                                        <span className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                                            Only {remaining} left
                                        </span>
                                    )}
                                    {remaining <= 0 && (
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                                            Out of stock
                                        </span>
                                    )}
                                </div>

                                <div className="p-5 mt-auto">
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
                                        className="w-full bg-olive-900 hover:opacity-90 text-lime-400 font-medium rounded-lg py-2.5 transition disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                                    >
                                        {remaining <= 0 ? 'Out of Stock' : 'Add to Cart'}
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