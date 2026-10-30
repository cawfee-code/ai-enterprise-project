/**
 * Calculates exact operational costs and final dynamic price in milliseconds.
 * Graph logic: Node 1 (Manufacturing) -> Node 2 (Logistics/Volumetric) -> Node 3 (Margin)
 */
const calculateDynamicPricing = (productDetails, shippingRatePerKg = 5.00) => {
    const start = performance.now();

    const { 
        baseManufacturingCost, 
        targetMarginPercentage, 
        physicalWeightKg, 
        dimensions 
    } = productDetails;

    // 1. Calculate Volumetric Weight (L * W * H / 5000)
    const volumetricWeightKg = (dimensions.lengthCm * dimensions.widthCm * dimensions.heightCm) / 5000;

    // 2. Traversal Decision: Logistics charges based on whichever is higher (Dead Weight vs Volumetric)
    const billableWeight = Math.max(physicalWeightKg, volumetricWeightKg);

    // 3. Calculate Base Operational Costs
    const shippingCost = billableWeight * shippingRatePerKg;
    const totalOperationalCost = baseManufacturingCost + shippingCost;

    // 4. Apply Target Margin %
    const marginMultiplier = 1 + (targetMarginPercentage / 100);
    const finalRetailPrice = totalOperationalCost * marginMultiplier;

    const end = performance.now();

    return {
        operationalCost: parseFloat(totalOperationalCost.toFixed(2)),
        billableWeightKg: parseFloat(billableWeight.toFixed(2)),
        finalPrice: parseFloat(finalRetailPrice.toFixed(2)),
        executionTimeMs: parseFloat((end - start).toFixed(4))
    };
};

module.exports = calculateDynamicPricing;