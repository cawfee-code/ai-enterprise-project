import { create } from 'zustand';

const useCartStore = create((set) => ({
    cart: [],
    
    // Add item to cart, or increment quantity if it already exists
    addToCart: (product) => set((state) => {
        const existingItem = state.cart.find(item => item.productId === product.productId);
        if (existingItem) {
            return {
                cart: state.cart.map(item =>
                    item.productId === product.productId 
                        ? { ...item, quantity: item.quantity + product.quantity }
                        : item
                )
            };
        }
        return { cart: [...state.cart, product] };
    }),

    // Clear the entire cart after a successful checkout
    clearCart: () => set({ cart: [] })
}));

export default useCartStore;