/**
 * State Machine for Supply Chain Routing
 * Logic: Bulk orders route to Retailer QC Hubs. Single orders dropship directly to the end customer.
 */
const determineRoute = (orderQuantity, manufacturerHub, retailerQCHub, customerAddress) => {
    const start = performance.now();
    let routingPlan = {};

    if (orderQuantity > 1) {
        // Bulk Order State: Route to QC
        routingPlan = {
            routeType: 'bulk_qc_routing',
            origin: manufacturerHub,
            destination: retailerQCHub,
            requiresQC: true,
            status: 'Pending QC Hub Delivery'
        };
    } else {
        // Single Order State: Dropship
        routingPlan = {
            routeType: 'direct_dropship',
            origin: manufacturerHub,
            destination: customerAddress,
            requiresQC: false,
            status: 'Pending Customer Delivery'
        };
    }

    const end = performance.now();
    
    return {
        ...routingPlan,
        stateMachineExecutionMs: parseFloat((end - start).toFixed(4))
    };
};

module.exports = determineRoute;