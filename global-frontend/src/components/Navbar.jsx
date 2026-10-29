import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);

    return (
        <nav className="bg-gray-900 text-white shadow-lg">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    <div className="flex-shrink-0 font-bold text-xl tracking-wider">
                        AI ENTERPRISE PLATFORM
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {user ? (
                            <>
                                <span className="px-3 py-1 bg-gray-800 rounded-full text-sm text-gray-300 border border-gray-700">
                                    Role: <span className="font-semibold text-white capitalize">{user.role}</span>
                                </span>
                                <button 
                                    onClick={logout}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm font-medium transition"
                                >
                                    Logout
                                </button>
                            </>
                        ) : (
                            <span className="text-gray-400 italic text-sm">Not Logged In</span>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;