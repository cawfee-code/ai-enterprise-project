import Navbar from './Navbar';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />
            
            {/* The main content area where Priyanka, Shouvik and Rohon will inject their pages */}
            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            <footer className="bg-white border-t py-6 text-center text-gray-500 text-sm">
                &copy; {new Date().getFullYear()} AI Enterprise Platform Architecture. All rights reserved.
            </footer>
        </div>
    );
};

export default Layout;