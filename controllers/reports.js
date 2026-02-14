import Sale from "../Models/sale.js";
import Purchase from "../Models/purchase.js";
import Product from "../Models/products.js";
import Customer from "../Models/customer.js";
import Supplier from "../Models/suppliers.js";
import Order from "../Models/order.js";
import { StatusCodes } from "http-status-codes";

const generateSalesReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;
    
    const matchCondition = {};
    if (startDate && endDate) {
      matchCondition.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const salesData = await Sale.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      {
        $group: {
          _id: null,
          totalSales: { $sum: "$totalAmount" },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" },
          totalQuantity: { $sum: "$quantity" },
          topProduct: { $first: "$product.productName" },
          uniqueCustomers: { $addToSet: "$customerId" }
        }
      },
      {
        $addFields: {
          uniqueCustomerCount: { $size: "$uniqueCustomers" }
        }
      },
      {
        $project: {
          uniqueCustomers: 0
        }
      }
    ]);

    const salesByProduct = await Sale.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$productId",
          productName: { $first: "$product.productName" },
          totalQuantity: { $sum: "$quantity" },
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    const salesByCustomer = await Sale.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      {
        $group: {
          _id: "$customerId",
          customerName: { $first: "$customer.name" },
          customerEmail: { $first: "$customer.email" },
          totalSpent: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" }
        }
      },
      { $sort: { totalSpent: -1 } }
    ]);

    const reportData = {
      summary: salesData[0] || {},
      details: salesByProduct,
      salesByProduct,
      salesByCustomer,
      reportType: "Sales",
      generatedAt: new Date(),
      period: { startDate, endDate }
    };

    if (format === "csv") {
      // Convert to CSV format (simplified)
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=sales-report-${Date.now()}.csv`);
      return res.send(convertToCSV(reportData));
    }

    res.status(StatusCodes.OK).json(reportData);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const generateInventoryReport = async (req, res) => {
  try {
    const { format = "json" } = req.query;

    const inventoryData = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $lookup: {
          from: "suppliers",
          localField: "supplierId",
          foreignField: "_id",
          as: "supplier"
        }
      },
      { $unwind: "$supplier" },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: 1 },
          totalStockValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
          totalPotentialRevenue: { $sum: { $multiply: ["$quantity", "$price"] } },
          lowStockItems: {
            $sum: {
              $cond: [{ $lte: ["$quantity", 10] }, 1, 0]
            }
          },
          outOfStockItems: {
            $sum: {
              $cond: [{ $eq: ["$quantity", 0] }, 1, 0]
            }
          },
          activeProducts: {
            $sum: {
              $cond: [{ $eq: ["$status", "active"] }, 1, 0]
            }
          }
        }
      }
    ]);

    const stockByCategory = await Product.aggregate([
      {
        $lookup: {
          from: "categories",
          localField: "categoryId",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" },
      {
        $group: {
          _id: "$category.name",
          totalQuantity: { $sum: "$quantity" },
          totalValue: { $sum: { $multiply: ["$quantity", "$costPrice"] } },
          productCount: { $sum: 1 },
          lowStockCount: {
            $sum: {
              $cond: [{ $lte: ["$quantity", 10] }, 1, 0]
            }
          }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    const lowStockProducts = await Product.find({ quantity: { $lte: 10 } })
      .populate("categoryId", "name")
      .populate("supplierId", "companyName")
      .sort({ quantity: 1 });

    const reportData = {
      summary: inventoryData[0] || {},
      details: lowStockProducts,
      stockByCategory,
      lowStockProducts,
      reportType: "Inventory",
      generatedAt: new Date()
    };

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=inventory-report-${Date.now()}.csv`);
      return res.send(convertToCSV(reportData));
    }

    res.status(StatusCodes.OK).json(reportData);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const generateFinancialReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;
    
    const matchCondition = {};
    if (startDate && endDate) {
      matchCondition.saleDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const salesData = await Sale.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          totalCost: { $sum: { $multiply: ["$quantity", "$product.costPrice"] } },
          totalProfit: {
            $sum: { $multiply: ["$quantity", { $subtract: ["$product.price", "$product.costPrice"] }] }
          },
          orderCount: { $sum: 1 }
        }
      },
      {
        $addFields: {
          profitMargin: {
            $multiply: [
              { $divide: ["$totalProfit", "$totalRevenue"] },
              100
            ]
          }
        }
      }
    ]);

    const purchaseData = await Purchase.aggregate([
      {
        $match: {
          purchaseDate: matchCondition.saleDate || {
            $gte: new Date(new Date().setMonth(new Date().getMonth() - 1))
          }
        }
      },
      {
        $group: {
          _id: null,
          totalPurchases: { $sum: "$totalCost" },
          purchaseCount: { $sum: 1 }
        }
      }
    ]);

    const profitByProduct = await Sale.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: "products",
          localField: "productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$productId",
          productName: { $first: "$product.productName" },
          totalRevenue: { $sum: "$totalAmount" },
          totalCost: { $sum: { $multiply: ["$quantity", "$product.costPrice"] } },
          totalProfit: {
            $sum: { $multiply: ["$quantity", { $subtract: ["$product.price", "$product.costPrice"] }] }
          },
          quantitySold: { $sum: "$quantity" }
        }
      },
      {
        $addFields: {
          profitMargin: {
            $multiply: [
              { $divide: ["$totalProfit", "$totalRevenue"] },
              100
            ]
          }
        }
      },
      { $sort: { totalProfit: -1 } }
    ]);

    const reportData = {
      summary: {
        ...salesData[0],
        totalPurchases: purchaseData[0]?.totalPurchases || 0,
        netProfit: (salesData[0]?.totalProfit || 0) - (purchaseData[0]?.totalPurchases || 0)
      },
      details: profitByProduct,
      profitByProduct,
      reportType: "Financial",
      generatedAt: new Date(),
      period: { startDate, endDate }
    };

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=financial-report-${Date.now()}.csv`);
      return res.send(convertToCSV(reportData));
    }

    res.status(StatusCodes.OK).json(reportData);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const generateCustomerReport = async (req, res) => {
  try {
    const { format = "json" } = req.query;

    const customerStats = await Customer.aggregate([
      {
        $lookup: {
          from: "sales",
          localField: "_id",
          foreignField: "customerId",
          as: "sales"
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          activeCustomers: {
            $sum: {
              $cond: [{ $gt: [{ $size: "$sales" }, 0] }, 1, 0]
            }
          },
          totalSalesValue: { $sum: { $sum: "$sales.totalAmount" } }
        }
      }
    ]);

    const topCustomers = await Sale.aggregate([
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer"
        }
      },
      { $unwind: "$customer" },
      {
        $group: {
          _id: "$customerId",
          customerName: { $first: "$customer.name" },
          customerEmail: { $first: "$customer.email" },
          customerPhone: { $first: "$customer.phone" },
          totalSpent: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" },
          firstOrderDate: { $min: "$saleDate" },
          lastOrderDate: { $max: "$saleDate" }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 20 }
    ]);

    const customerAcquisition = await Customer.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    const reportData = {
      summary: customerStats[0] || {},
      details: topCustomers,
      topCustomers,
      customerAcquisition,
      reportType: "Customer",
      generatedAt: new Date()
    };

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=customer-report-${Date.now()}.csv`);
      return res.send(convertToCSV(reportData));
    }

    res.status(StatusCodes.OK).json(reportData);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

const generateOrderReport = async (req, res) => {
  try {
    const { startDate, endDate, format = "json" } = req.query;
    
    const matchCondition = {};
    if (startDate && endDate) {
      matchCondition.orderDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const orderStats = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$totalAmount" }
        }
      }
    ]);

    const orderSummary = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalOrderValue: { $sum: "$totalAmount" },
          averageOrderValue: { $avg: "$totalAmount" },
          totalItems: { $sum: { $size: "$items" } }
        }
      }
    ]);

    const ordersByPaymentMethod = await Order.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalValue: { $sum: "$totalAmount" }
        }
      },
      { $sort: { totalValue: -1 } }
    ]);

    const orders = await Order.find(matchCondition).sort({ orderDate: -1 }).limit(50);

    const reportData = {
      summary: orderSummary[0] || {},
      details: orders.map(o => ({
        orderId: o._id,
        date: o.orderDate,
        supplier: o.supplierName || 'N/A',
        total: o.totalAmount,
        status: o.status,
        payment: o.paymentMethod
      })),
      orderStats,
      ordersByPaymentMethod,
      reportType: "Order",
      generatedAt: new Date(),
      period: { startDate, endDate }
    };

    if (format === "csv") {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename=order-report-${Date.now()}.csv`);
      return res.send(convertToCSV(reportData));
    }

    res.status(StatusCodes.OK).json(reportData);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: error.message,
    });
  }
};

// Helper function to convert data to CSV
const convertToCSV = (data) => {
  // Simplified CSV conversion - in production, you'd want a more robust solution
  let csv = "Report Generated: " + new Date().toISOString() + "\n\n";
  
  if (data.summary) {
    csv += "Summary\n";
    Object.entries(data.summary).forEach(([key, value]) => {
      csv += `${key},${value}\n`;
    });
    csv += "\n";
  }

  return csv;
};

export {
  generateSalesReport,
  generateInventoryReport,
  generateFinancialReport,
  generateCustomerReport,
  generateOrderReport
};
