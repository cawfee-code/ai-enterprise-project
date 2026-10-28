import { createContext, useState } from 'react';

// Create the context
export const AuthContext = createContext();

// Create the provider component
export const AuthProvider = ({ children }) => {
    // user state will eventually hold { role: 'retailer', token: 'eyJhb...' }
    const [user, setUser] = useState(null);

    const login = (userData) => {
        setUser(userData);
        // We will later add logic here to save the JWT to localStorage
    };

    const logout = () => {
        setUser(null);
        // We will later add logic here to remove the JWT from localStorage
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};