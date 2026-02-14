import Sale from "../Models/sale.js";
import Product from "../Models/products.js";
import { StatusCodes } from "http-status-codes";

const addSale = async (req, res) => {
  const { customerId, productId, quantity, unitPrice, status, invoiceNo } = req.body;
  
  // Check Stock
  const product = await Product.findById(productId);
  if (!product) {
      return res.status(StatusCodes.NOT_FOUND).json({ message: "Product not found" });
  }

  if (product.quantity < quantity) {
      return res.status(StatusCodes.BAD_REQUEST).json({ message: `Insufficient stock. Available: ${product.quantity}` });
  }

  const totalAmount = quantity * unitPrice;

  const sale = await Sale.create({
    ...req.body,
    totalAmount,
    invoiceNo: invoiceNo || `INV-${Date.now()}`
  });

  // Update Product Stock if status is Completed (or not provided, as it defaults to Completed)
  const isCompleted = status === "Completed" || !status;
  if (isCompleted) {
    await Product.findByIdAndUpdate(productId, { $inc: { quantity: -quantity } });
  }

  res.status(StatusCodes.CREATED).json({
    message: "Sale recorded successfully",
    sale,
  });
};

const getSales = async (req, res) => {
  const sales = await Sale.find({})
    .populate("customerId", "name")
    .populate("productId", "productName");
  res.status(StatusCodes.OK).json({ count: sales.length, sales });
};

const getSaleById = async (req, res) => {
  const { id } = req.params;
  const sale = await Sale.findById(id)
      .populate("customerId", "name")
      .populate("productId", "productName");
  if (!sale) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Sale not found",
    });
  }
  res.status(StatusCodes.OK).json({ sale });
};

const deleteSale = async (req, res) => {
  const { id } = req.params;
  const sale = await Sale.findById(id);
  
  if (!sale) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Sale not found",
    });
  }

  // If sale was completed, return stock
  if (sale.status === "Completed") {
     await Product.findByIdAndUpdate(sale.productId, { $inc: { quantity: sale.quantity } });
  }

  await Sale.findByIdAndDelete(id);

  res.status(StatusCodes.OK).json({
    message: "Sale deleted and stock adjusted",
  });
};

const updateSale = async (req, res) => {
  const { id } = req.params;
  const { status, quantity, unitPrice } = req.body;
  
  const sale = await Sale.findById(id);
  if (!sale) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Sale not found",
    });
  }

  // Handle stock adjustments for status changes
  // This logic is complex; assuming simple state transitions for now.
  if (sale.status === "Completed" && status !== "Completed") {
    // Return stock to inventory
    await Product.findByIdAndUpdate(sale.productId, { $inc: { quantity: sale.quantity } });
  } else if (sale.status !== "Completed" && status === "Completed") {
    // Remove stock from inventory
    const product = await Product.findById(sale.productId);
    
    // Check if enough stock exists (considering if quantity also changed, we need original logic)
    // Here we use the NEW quantity if provided, else OLD quantity
    const qtyToCheck = quantity !== undefined ? quantity : sale.quantity;
    
    if (qtyToCheck > product.quantity) {
      return res.status(StatusCodes.BAD_REQUEST).json({ 
        message: `Insufficient stock to complete sale. Available: ${product.quantity}` 
      });
    }
    await Product.findByIdAndUpdate(sale.productId, { $inc: { quantity: -qtyToCheck } });
  }

  // If quantity changed but status remained Completed, we need to adjust the diff
  if (sale.status === "Completed" && status === "Completed" && quantity !== undefined && quantity !== sale.quantity) {
      const diff = quantity - sale.quantity; // Positive = took more, Negative = returned some
      const product = await Product.findById(sale.productId);
      if (diff > 0 && diff > product.quantity) {
           return res.status(StatusCodes.BAD_REQUEST).json({ message: `Insufficient stock for increase.` });
      }
      await Product.findByIdAndUpdate(sale.productId, { $inc: { quantity: -diff } });
  }

  // Update sale with new values
  let totalAmount = sale.totalAmount;
  if (quantity || unitPrice) {
      const q = quantity || sale.quantity;
      const p = unitPrice || sale.unitPrice;
      totalAmount = q * p;
  }

  Object.assign(sale, { ...req.body, totalAmount });
  await sale.save();

  res.status(StatusCodes.OK).json({
    message: "Sale updated successfully",
    sale,
  });
};

export {
  addSale,
  getSales,
  getSaleById,
  updateSale,
  deleteSale,
};
