import { useState } from 'react';
import ProductRetailerCatalog from './ProductRetailerCatalog';
import DesignManagerRetailer from './DesignManagerRetailer';
import RetailerSettingsForm from './RetailerSettingsForm';
import RetailerQCHubsForm from './RetailerQCHubsForm';
import RetailerAnalyticsCard from './RetailerAnalyticsCard';

const TABS = [
    { id: 'catalog', label: 'Product Catalog' },
    { id: 'designs', label: 'My Designs' },
    { id: 'settings', label: 'Pricing Settings' },
    { id: 'hubs', label: 'QC Hubs' },
    { id: 'analytics', label: 'Order Analytics' },
];

const RetailerDashboard = ({ onSimulateBulkOrder }) => {
    const [activeTab, setActiveTab] = useState('catalog');

    return (
        <div className="flex gap-6 items-start">
            <div className="w-56 shrink-0 rounded-xl bg-[var(--color-forest-900)] p-4 sticky top-6">
                <div className="flex flex-col gap-1">
                    {onSimulateBulkOrder && (
                        <button
                            onClick={onSimulateBulkOrder}
                            className="text-left px-3.5 py-2.5 rounded-lg text-sm text-[#a9bdb1] hover:text-white transition mb-1"
                        >
                            Simulate Bulk Order Placement
                        </button>
                    )}
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`text-left px-3.5 py-2.5 rounded-lg text-sm transition ${
                                activeTab === tab.id
                                    ? 'bg-[var(--color-accent-lime)] text-[var(--color-forest-900)] font-semibold'
                                    : 'text-[#a9bdb1] hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="text-[11px] text-[#607a6c] px-3.5 pt-6">Retailer workspace</div>
            </div>

            <div className="flex-1 min-w-0 bg-[var(--color-paper)] rounded-xl p-8">
                {activeTab === 'catalog' && <ProductRetailerCatalog />}
                {activeTab === 'designs' && <DesignManagerRetailer />}
                {activeTab === 'settings' && <RetailerSettingsForm />}
                {activeTab === 'hubs' && <RetailerQCHubsForm />}
                {activeTab === 'analytics' && <RetailerAnalyticsCard />}
            </div>
        </div>
    );
};

export default RetailerDashboard;