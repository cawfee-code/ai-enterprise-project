import { useState } from 'react';
import ManufacturerAnalyticsCard from './ManufacturerAnalyticsCard';
import CustomerSegmentation from './CustomerSegmentation';
import ManufacturerCustomerTable from './ManufacturerCustomerTable';
import ManufacturerProductRates from './ManufacturerProductRates';
import ManufacturerHubForm from './ManufacturerHubForm';
import ManufacturerOrderQueue from './ManufacturerOrderQueue';
import ManufacturerOrderAnalyticsCard from './ManufacturerOrderAnalyticsCard';

const TABS = [
    { id: 'overview', label: 'Executive Dashboard' },
    { id: 'segmentation', label: 'Customer Segmentation' },
    { id: 'customers', label: 'Your Customers' },
    { id: 'rates', label: 'Products & Pricing' },
    { id: 'warehouse', label: 'Warehouse Address' },
    { id: 'queue', label: 'Production Queue' },
    { id: 'analytics', label: 'Order Analytics' },
];

const ManufacturerDashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="flex gap-6 items-start">
            <div className="w-56 shrink-0 rounded-xl bg-[var(--color-plum-900)] p-4 sticky top-6">
                <div className="flex flex-col gap-1">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`text-left px-3.5 py-2.5 rounded-lg text-sm transition ${
                                activeTab === tab.id
                                    ? 'bg-[var(--color-accent-violet)] text-[var(--color-plum-900)] font-semibold'
                                    : 'text-[#b8aee0] hover:text-white'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="text-[11px] text-[#7c72a3] px-3.5 pt-6">Manufacturer workspace</div>
            </div>

            <div className="flex-1 min-w-0 bg-[var(--color-paper)] rounded-xl p-8">
                {activeTab === 'overview' && <ManufacturerAnalyticsCard />}
                {activeTab === 'segmentation' && <CustomerSegmentation />}
                {activeTab === 'customers' && <ManufacturerCustomerTable />}
                {activeTab === 'rates' && <ManufacturerProductRates />}
                {activeTab === 'warehouse' && <ManufacturerHubForm />}
                {activeTab === 'queue' && <ManufacturerOrderQueue />}
                {activeTab === 'analytics' && <ManufacturerOrderAnalyticsCard />}
            </div>
        </div>
    );
};

export default ManufacturerDashboard;