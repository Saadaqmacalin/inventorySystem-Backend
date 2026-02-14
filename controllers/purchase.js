import Purchase from "../Models/purchase.js";
import Product from "../Models/products.js";
import { StatusCodes } from "http-status-codes";

const addPurchase = async (req, res) => {
  const { supplierId, productId, quantity, unitCost, status, refNo } = req.body;
  
  const totalCost = quantity * unitCost;

  const purchase = await Purchase.create({
    ...req.body,
    totalCost,
    refNo: refNo || `PUR-${Date.now()}`
  });

  // Update Product Stock if status is Received
  if (status === "Received") {
    await Product.findByIdAndUpdate(productId, { $inc: { quantity: quantity } });
  }

  res.status(StatusCodes.CREATED).json({
    message: "Purchase recorded successfully",
    purchase,
  });
};

const getPurchases = async (req, res) => {
  const purchases = await Purchase.find({})
    .populate("supplierId", "companyName")
    .populate("productId", "productName");
  res.status(StatusCodes.OK).json({ count: purchases.length, purchases });
};

const getPurchaseById = async (req, res) => {
  const { id } = req.params;
  const purchase = await Purchase.findById(id)
      .populate("supplierId", "companyName")
      .populate("productId", "productName");
  if (!purchase) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Purchase not found",
    });
  }
  res.status(StatusCodes.OK).json({ purchase });
};

const deletePurchase = async (req, res) => {
  const { id } = req.params;
  const purchase = await Purchase.findById(id);
  
  if (!purchase) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Purchase not found",
    });
  }

  // If purchase was received, reverse the stock update (reduce stock)
  if (purchase.status === "Received") {
     const product = await Product.findById(purchase.productId);
     if (product) {
        // Ensure we don't go below zero if possible, or just force it? 
        // Logic says we should reduce, but what if stock is 0? It becomes -quantity?
        // Assuming inventory tracking allows negative or we catch it. 
        // Simple logic: just reduce.
        await Product.findByIdAndUpdate(purchase.productId, { $inc: { quantity: -purchase.quantity } });
     }
  }

  await Purchase.findByIdAndDelete(id);

  res.status(StatusCodes.OK).json({
    message: "Purchase deleted and stock adjusted",
  });
};

const updatePurchase = async (req, res) => {
  const { id } = req.params;
  const { status, quantity, unitCost } = req.body;
  
  const purchase = await Purchase.findById(id);
  if (!purchase) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Purchase not found",
    });
  }

  // Handle stock adjustments for status changes
  if (purchase.status === "Received" && status !== "Received") {
    // Remove stock from inventory (reverting the add)
    await Product.findByIdAndUpdate(purchase.productId, { $inc: { quantity: -purchase.quantity } });
  } else if (purchase.status !== "Received" && status === "Received") {
    // Add stock to inventory
    // Use new quantity if provided
    const qtyToAdd = quantity !== undefined ? quantity : purchase.quantity;
    await Product.findByIdAndUpdate(purchase.productId, { $inc: { quantity: qtyToAdd } });
  }
  
  // If status is Received and stays Received, but quantity changes
  if (purchase.status === "Received" && status === "Received" && quantity !== undefined && quantity !== purchase.quantity) {
      const diff = quantity - purchase.quantity; // Positive = bought more, Negative = bought less
      await Product.findByIdAndUpdate(purchase.productId, { $inc: { quantity: diff } });
  }

  // Update purchase with new values
  let totalCost = purchase.totalCost;
  if(quantity || unitCost) {
      const q = quantity !== undefined ? quantity : purchase.quantity;
      const c = unitCost !== undefined ? unitCost : purchase.unitCost;
      totalCost = q * c;
  }
  
  Object.assign(purchase, { ...req.body, totalCost });
  await purchase.save();

  res.status(StatusCodes.OK).json({
    message: "Purchase updated successfully",
    purchase,
  });
};

export {
  addPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
};
