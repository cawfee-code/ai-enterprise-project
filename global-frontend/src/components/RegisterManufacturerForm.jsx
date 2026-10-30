import { useState } from 'react';
import { register } from '../api/authManufacturerApi';
import { isValidEmail, getPasswordError } from '../utils/validation';

const RegisterManufacturerForm = ({ onSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!isValidEmail(email)) {
            setError('Please enter a valid email address.');
            return;
        }
        const passwordError = getPasswordError(password);
        if (passwordError) {
            setError(passwordError);
            return;
        }

        setLoading(true);
        try {
            await register({ email, password });
            onSuccess?.({ email });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-purple-200 p-8 max-w-md mx-auto">
            <h2 className="text-2xl font-bold text-purple-900 mb-6 text-center">Create Manufacturer Account</h2>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                    {error}
                </div>
            )}

            <label className="block mb-4">
                <span className="text-sm font-medium text-purple-900">Email</span>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-purple-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
            </label>

            <label className="block mb-2">
                <span className="text-sm font-medium text-purple-900">Password</span>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1 w-full rounded-lg border border-purple-200 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-400"
                />
            </label>
            <p className="text-xs text-purple-300 mb-6">
                At least 8 characters, with an uppercase letter, a lowercase letter, and a number.
            </p>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg py-2.5 transition disabled:opacity-60"
            >
                {loading ? 'Creating account...' : 'Register as Manufacturer'}
            </button>
        </form>
    );
};

export default RegisterManufacturerForm;