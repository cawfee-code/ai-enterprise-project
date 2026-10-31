import { useState } from 'react';
import ProductRetailerCatalog from './ProductRetailerCatalog';
import DesignManagerRetailer from './DesignManagerRetailer';
import RetailerSettingsForm from './RetailerSettingsForm';

const TABS = [
    { id: 'catalog', label: 'Product Catalog' },
    { id: 'designs', label: 'My Designs' },
    { id: 'settings', label: 'Pricing Settings' },
];

const RetailerDashboard = () => {
    const [activeTab, setActiveTab] = useState('catalog');

    return (
        <div className="font-playfair max-w-5xl mx-auto">
            <div className="flex gap-1 border-b border-sage-200 mb-8">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition ${
                            activeTab === tab.id
                                ? 'border-olive-900 text-olive-900'
                                : 'border-transparent text-gray-400 hover:text-olive-900'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'catalog' && <ProductRetailerCatalog />}
            {activeTab === 'designs' && <DesignManagerRetailer />}
            {activeTab === 'settings' && <RetailerSettingsForm />}
        </div>
    );
};

export default RetailerDashboard;