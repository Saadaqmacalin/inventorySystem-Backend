import Customer from "../Models/customer.js";
import { StatusCodes } from "http-status-codes";

export const registerCustomer = async (req, res) => {
    try {
        const { name, email, password, phone, address } = req.body;
        
        const emailExists = await Customer.findOne({ email });
        if (emailExists) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Email already registered" });
        }

        const customer = await Customer.create({
            name,
            email,
            password,
            phone,
            address,
            status: "Active"
        });

        const token = customer.createJWT();
        res.status(StatusCodes.CREATED).json({
            message: "Registration successful",
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone
            },
            token
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            message: error.message || "Registration failed" 
        });
    }
};

export const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(StatusCodes.BAD_REQUEST).json({ message: "Please provide email and password" });
        }

        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }

        if (customer.status !== "Active") {
            return res.status(StatusCodes.FORBIDDEN).json({ message: "Account is inactive" });
        }

        const isPasswordCorrect = await customer.comparePassword(password);
        if (!isPasswordCorrect) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ message: "Invalid credentials" });
        }

        const token = customer.createJWT();
        res.status(StatusCodes.OK).json({
            message: "Login successful",
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                role: 'CUSTOMER'
            },
            token
        });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            message: "Login failed" 
        });
    }
};

export const getCustomerProfile = async (req, res) => {
    try {
        const customer = await Customer.findById(req.user.userId).select("-password");
        if (!customer) {
            return res.status(StatusCodes.NOT_FOUND).json({ message: "Customer not found" });
        }
        res.status(StatusCodes.OK).json({ customer });
    } catch (error) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ message: "Failed to fetch profile" });
    }
};
