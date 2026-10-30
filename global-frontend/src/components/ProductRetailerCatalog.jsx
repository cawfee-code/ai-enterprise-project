import { useEffect, useState } from 'react';
import { fetchProducts } from '../api/productRetailerApi';
import useCartStore from '../store/useCartStore';

const ProductRetailerCatalog = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const addToCart = useCartStore((state) => state.addToCart);

    useEffect(() => {
        fetchProducts()
            .then(setProducts)
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p className="text-center text-gray-500 mt-10">Loading products...</p>;
    }

    if (error) {
        return <p className="text-center text-red-600 mt-10">{error}</p>;
    }

    if (products.length === 0) {
        return <p className="text-center text-gray-500 mt-10">No products available yet.</p>;
    }

    return (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
                <div
                    key={product._id}
                    className="bg-white rounded-2xl shadow-sm border border-sage-200 p-5 flex flex-col"
                >
                    <h3 className="font-semibold text-olive-900 mb-1">{product.name}</h3>
                    <p className="text-sm text-gray-500 mb-3 flex-grow">{product.description}</p>

                    <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-bold text-olive-900">
                            ${product.price?.toFixed(2)}
                        </span>
                        <span className="text-xs text-gray-400">
                            {product.stockCount} in stock
                        </span>
                    </div>

                    <button
                        onClick={() =>
                            addToCart({
                                productId: product._id,
                                name: product.name,
                                quantity: 1,
                                price: product.price,
                            })
                        }
                        disabled={product.stockCount === 0}
                        className="w-full bg-lime-400 hover:bg-lime-500 text-olive-900 font-semibold rounded-lg py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {product.stockCount === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ProductRetailerCatalog;