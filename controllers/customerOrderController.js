import Order from "../Models/order.js";
import Product from "../Models/products.js";
import { StatusCodes } from "http-status-codes";

export const placeCustomerOrder = async (req, res) => {
    try {
        const { items, shippingAddress, billingAddress, paymentMethod, notes } = req.body;
        const customerId = req.user.userId;

        if (!items || items.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Order must contain at least one item" });
        }

        // Calculate totals and verify products
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const product = await Product.findById(item.productId);
            if (!product) {
                return res.status(StatusCodes.NOT_FOUND).json({ message: `Product ${item.productId} not found` });
            }

            if (product.quantity < item.quantity) {
                return res.status(StatusCodes.BAD_REQUEST).json({ message: `Insufficient stock for ${product.productName}` });
            }

            const itemTotalPrice = product.price * item.quantity;
            totalAmount += itemTotalPrice;

            orderItems.push({
                productId: product._id,
                quantity: item.quantity,
                unitPrice: product.price,
                totalPrice: itemTotalPrice
            });
        }

        const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        const order = await Order.create({
            orderNumber,
            customerId,
            items: orderItems,
            totalAmount,
            shippingAddress,
            billingAddress,
            paymentMethod,
            notes,
            expectedDeliveryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Default 3 days
            status: "Pending",
            paymentStatus: "Pending"
        });

        res.status(StatusCodes.CREATED).json({
            message: "Order placed successfully",
            order
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            message: error.message || "Failed to place order" 
        });
    }
};

export const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customerId: req.user.userId })
            .sort("-createdAt")
            .populate("items.productId", "productName image");
        
        res.status(StatusCodes.OK).json({ orders });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch orders" });
    }
};
