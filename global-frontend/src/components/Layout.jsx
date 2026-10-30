import Navbar from './Navbar';

const Layout = ({ children, onLoginAsRetailer, onLoginAsManufacturer, theme = 'retailer' }) => {
    const bgClass =
    theme === 'manufacturer' ? 'animated-gradient-bg-purple' :
    theme === 'retailer' ? 'animated-gradient-bg' :
    'animated-gradient-bg-mixed';

    return (
        <div className={`min-h-screen ${bgClass} flex flex-col`}>
            <Navbar onLoginAsRetailer={onLoginAsRetailer} onLoginAsManufacturer={onLoginAsManufacturer} />

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            <footer className="bg-white/40 backdrop-blur-md border-t border-sage-200/40 py-6 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} AI Enterprise Platform Architecture. All rights reserved.
            </footer>
        </div>
    );
};

export default Layout;