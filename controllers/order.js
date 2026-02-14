import Order from "../Models/order.js";
import Product from "../Models/products.js";
import Customer from "../Models/customer.js";
import Sale from "../Models/sale.js";
import { StatusCodes } from "http-status-codes";

const createOrder = async (req, res) => {
  try {
    const {
      customerId,
      items,
      expectedDeliveryDate,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes
    } = req.body;

    if (!customerId || !items || items.length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        message: "Customer and items are required",
      });
    }

    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Customer not found",
      });
    }

    // Validate products and calculate totals
    let totalAmount = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(StatusCodes.NOT_FOUND).json({
          message: `Product not found: ${item.productId}`,
        });
      }

      if (item.quantity > product.quantity) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: `Insufficient stock for ${product.productName}. Available: ${product.quantity}`,
        });
      }

      const unitPrice = item.unitPrice || product.price;
      const totalPrice = item.quantity * unitPrice;
      
      orderItems.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice,
        totalPrice
      });

      totalAmount += totalPrice;
    }

    // Calculate tax and shipping (simplified)
    const taxAmount = totalAmount * 0.1; // 10% tax
    const shippingCost = 10; // Flat shipping cost
    const finalTotal = totalAmount + taxAmount + shippingCost;

    // Generate order number
    const orderNumber = `ORD-${Date.now()}`;

    const order = await Order.create({
      orderNumber,
      customerId,
      items: orderItems,
      expectedDeliveryDate,
      shippingAddress,
      billingAddress,
      paymentMethod,
      notes,
      totalAmount: finalTotal,
      taxAmount,
      shippingCost
    });

    const populatedOrder = await Order.findById(order._id)
      .populate("customerId", "name email phone")
      .populate("items.productId", "productName");

    res.status(StatusCodes.CREATED).json({
      message: "Order created successfully",
      order: populatedOrder,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {};
    if (status) {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .populate("customerId", "name email phone")
      .populate("items.productId", "productName")
      .sort({ createdAt: -1 });

    const total = await Order.countDocuments(filter);

    res.status(StatusCodes.OK).json({
      orders,
      total,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate("customerId", "name email phone")
      .populate("items.productId", "productName description");

    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Order not found",
      });
    }

    res.status(StatusCodes.OK).json({ order });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, trackingNumber } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Order not found",
      });
    }

    const previousStatus = order.status;

    // Auto-create Sales and deduct stock when marked as Delivered
    if (status === "Delivered" && previousStatus !== "Delivered") {
        // Check if sales records already exist for this order to prevent duplicates
        const existingSales = await Sale.findOne({ invoiceNo: `INV-${order.orderNumber}` });
        
        if (!existingSales) {
            const salesData = [];
            
            for (const item of order.items) {
                // Deduct from Product Stock
                await Product.findByIdAndUpdate(item.productId, { 
                  $inc: { quantity: -item.quantity } 
                });

                salesData.push({
                    customerId: order.customerId,
                    productId: item.productId,
                    quantity: item.quantity,
                    unitPrice: item.unitPrice,
                    totalAmount: item.totalPrice,
                    invoiceNo: `INV-${order.orderNumber}`,
                    status: "Completed",
                    saleDate: new Date()
                });
            }
            
            await Sale.insertMany(salesData);
            console.log(`Generated ${salesData.length} sales records and updated inventory for order ${order.orderNumber}`);
        }
    }

    order.status = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }
    
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate("customerId", "name email phone")
      .populate("items.productId", "productName");

    res.status(StatusCodes.OK).json({
      message: `Order status updated to ${status}${status === 'Delivered' ? ' and sales recorded' : ''}`,
      order: updatedOrder,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { paymentStatus } = req.body;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Order not found",
      });
    }

    order.paymentStatus = paymentStatus;
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate("customerId", "name email phone")
      .populate("items.productId", "productName");

    res.status(StatusCodes.OK).json({
      message: "Payment status updated successfully",
      order: updatedOrder,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id);
    if (!order) {
      return res.status(StatusCodes.NOT_FOUND).json({
        message: "Order not found",
      });
    }

    // No stock adjustment needed here anymore as it's only deducted on delivery

    await Order.findByIdAndDelete(id);

    res.status(StatusCodes.OK).json({
      message: "Order deleted",
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const getOrderStats = async (req, res) => {
  try {
    const stats = await Order.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);

    const totalOrders = await Order.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: "Delivered" } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);

    res.status(StatusCodes.OK).json({
      stats,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

export {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats
};
