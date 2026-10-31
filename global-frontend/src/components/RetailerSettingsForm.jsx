import { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { fetchRetailerSettings, saveRetailerSettings, deleteRetailerSettings } from '../api/retailerSettingsApi';


const RetailerSettingsForm = () => {
    const { user } = useContext(AuthContext);
    const [value, setValue] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [resetting, setResetting] = useState(false);
    const [savedMessage, setSavedMessage] = useState('');


    useEffect(() => {
        fetchRetailerSettings(user.token)
            .then((data) => {
                if (data.exists) setValue(String(data.targetProfitPercentage));
            })
            .catch((err) => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSavedMessage('');

        const numericValue = parseFloat(value);
        if (Number.isNaN(numericValue) || numericValue < 0 || numericValue > 100) {
            setError('Enter a number between 0 and 100.');
            return;
        }

        setSaving(true);
        try {
            await saveRetailerSettings(numericValue, user.token);
            setSavedMessage('Saved.');
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleReset = async () => {
        if (!window.confirm('Reset your profit percentage? You\'ll need to set it again.')) return;
        setError('');
        setSavedMessage('');
        setResetting(true);
        try {
            await deleteRetailerSettings(user.token);
            setValue('');
            setSavedMessage('Reset.');
        } catch (err) {
            setError(err.message);
        } finally {
            setResetting(false);
        }
    };

    return (
        <div>
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-olive-900">Pricing Settings</h2>
                <p className="text-sm text-gray-500 mt-1">Set the profit margin you target on top of wholesale pricing</p>
            </div>

            <div className="bg-white rounded-3xl border border-sage-200 shadow-sm p-6 max-w-md mx-auto">
                {loading ? (
                    <p className="text-sm text-gray-500">Loading your settings…</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <label className="text-sm font-medium text-olive-900 mb-1 block">
                            Target profit percentage
                        </label>
                        <div className="flex items-center gap-2 mb-3">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={value}
                                onChange={(e) => setValue(e.target.value)}
                                placeholder="e.g. 25"
                                required
                                className="flex-1 rounded-lg border border-sage-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-lime-400"
                            />
                            <span className="text-sm text-gray-500">%</span>
                        </div>

                        {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
                        {savedMessage && <p className="text-sm text-green-600 mb-3">{savedMessage}</p>}

                        <div className="flex gap-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 bg-lime-400 hover:bg-lime-500 text-olive-900 font-semibold rounded-lg py-2 text-sm transition disabled:opacity-60"
                            >
                                {saving ? 'Saving…' : 'Save'}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={resetting || !value}
                                className="px-4 rounded-lg border border-sage-200 text-sm text-olive-900 hover:bg-gray-50 transition disabled:opacity-40"
                            >
                                {resetting ? 'Resetting…' : 'Reset'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};

export default RetailerSettingsForm;