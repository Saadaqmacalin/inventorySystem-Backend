import Suppliers from "../Models/suppliers.js";
import { StatusCodes } from "http-status-codes";

const addSuppliers = async (req, res) => {
  // Duplication check (e.g. by email/phone/companyName)
  // Usually unique index on DB handles this, but meaningful error is good.
  // Validation layer handles basic required fields.
  
  const supplier = await Suppliers.create(req.body);
  res.status(StatusCodes.CREATED).json({
    message: "Supplier added successfully",
    supplier,
  });
};

const getSuppliers = async (req, res) => {
  const suppliers = await Suppliers.find({});
  res
    .status(StatusCodes.OK)
    .json({ TotalSuppliers: suppliers.length, suppliers });
};

const getSupplierById = async (req, res) => {
  const { id } = req.params;
  const supplier = await Suppliers.findById(id);
  if (!supplier) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Supplier not found",
    });
  }
  res
    .status(StatusCodes.OK)
    .json({ message: "Supplier details", supplier });
};

const UpdateSupplier = async (req, res) => {
  const { id } = req.params;
  
  const supplier = await Suppliers.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!supplier) {
    return res
      .status(StatusCodes.NOT_FOUND)
      .json({ message: "Supplier not found" });
  }
  res
    .status(StatusCodes.OK)
    .json({ message: "Supplier updated successfully", supplier });
};

const deleteSupplier = async (req, res) => {
  const { id } = req.params;
  const supplier = await Suppliers.findByIdAndDelete(id);
  if (!supplier) {
    return res.status(StatusCodes.NOT_FOUND).json({
      message: "Supplier not found",
    });
  }
  res
    .status(StatusCodes.OK)
    .json({ message: "Supplier deleted successfully" });
};

export {
  addSuppliers,
  getSuppliers,
  getSupplierById,
  UpdateSupplier,
  deleteSupplier,
};
