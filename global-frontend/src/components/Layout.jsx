import Navbar from './Navbar';

const Layout = ({ children, onLoginAsRetailer, onLoginAsManufacturer, theme = 'retailer' }) => {
    return (
        <div className="min-h-screen bg-paper flex flex-col">
            <Navbar onLoginAsRetailer={onLoginAsRetailer} onLoginAsManufacturer={onLoginAsManufacturer} />

            <main className="flex-grow w-full px-4 sm:px-6 lg:px-10 py-8">
                {children}
            </main>

            <footer className="bg-forest-900 py-6 text-center text-[#6f8c7c] text-sm">
                &copy; {new Date().getFullYear()} AI Enterprise Platform Architecture. All rights reserved.
            </footer>
        </div>
    );
};

export default Layout;