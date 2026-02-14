import Customer from "../Models/customer.js";
import { StatusCodes } from "http-status-codes";

const addCustomer = async (req, res) => {
  const customer = await Customer.create(req.body);
  res.status(StatusCodes.CREATED).json({
    message: "Customer added successfully",
    customer,
  });
};

const getCustomers = async (req, res) => {
  const customers = await Customer.find({});
  res.status(StatusCodes.OK).json({ count: customers.length, customers });
};

const getCustomerById = async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findById(id);
  if (!customer) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Customer not found",
    });
  }
  res.status(StatusCodes.OK).json({ customer });
};

const updateCustomer = async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!customer) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Customer not found",
    });
  }
  res.status(StatusCodes.OK).json({
    message: "Customer updated successfully",
    customer,
  });
};

const deleteCustomer = async (req, res) => {
  const { id } = req.params;
  const customer = await Customer.findByIdAndDelete(id);
  if (!customer) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Customer not found",
    });
  }
  res.status(StatusCodes.OK).json({
    message: "Customer deleted successfully",
  });
};

export {
  addCustomer,
  getCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
};
