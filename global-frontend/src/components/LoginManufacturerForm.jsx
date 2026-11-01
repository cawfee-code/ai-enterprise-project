import { useState } from 'react';
import { login } from '../api/authManufacturerApi';
import { isValidEmail } from '../utils/validation';

const LoginManufacturerForm = ({ onSuccess }) => {
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

        setLoading(true);
        try {
            const data = await login({ email, password });
            onSuccess?.({ role: 'manufacturer', token: data.token });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2 className="text-2xl font-semibold text-ink-900 mb-1">Welcome back</h2>
            <p className="text-sm text-muted mb-6">Log in to your manufacturer account</p>

            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
                    {error}
                </div>
            )}

            <label className="block mb-4">
                <span className="text-sm font-medium text-ink-900">Email</span>
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-lg border border-hairline px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-violet"
                />
            </label>

            <label className="block mb-6">
                <span className="text-sm font-medium text-ink-900">Password</span>
                <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="mt-1.5 w-full rounded-lg border border-hairline px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent-violet"
                />
            </label>

            <button
                type="submit"
                disabled={loading}
                className="w-full bg-ink-900 hover:opacity-90 text-accent-violet font-semibold rounded-lg py-3 text-sm transition disabled:opacity-60"
            >
                {loading ? 'Logging in...' : 'Log in'}
            </button>
        </form>
    );
};

export default LoginManufacturerForm;