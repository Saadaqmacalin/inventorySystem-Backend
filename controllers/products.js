import Products from "../Models/products.js";
import { StatusCodes } from "http-status-codes";
import mongoose from "mongoose";

const addProduct = async (req, res) => {
  const product = await Products.create(req.body);
  res.status(StatusCodes.CREATED).json({ message: "Product added successfully", product });
};

const getProducts = async (req, res) => {
  const products = await Products.find({})
    .populate("categoryId", "name")
    .populate("supplierId", "name");

  if (products.length === 0) {
    // Ideally returning empty array is fine, but keeping behavior consistent with previous if needed. 
    // Usually 200 OK with [] is better than 404 for list endpoints.
    // I will return 200 with empty list to be more RESTful, but message suggests they want 404 sometimes? 
    // sticking to 200 with array.
    return res.status(StatusCodes.OK).json({ products: [] }); 
  }

  res.status(StatusCodes.OK).json({ products });
};

const getSingleProduct = async (req, res) => {
  const { id } = req.params;

  const product = await Products.findById(id)
    .populate("categoryId", "name")
    .populate("supplierId", "name");

  if (!product) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Product not found" });
  }

  res.status(StatusCodes.OK).json({ product });
};

const updateProduct = async (req, res) => {
  const { id } = req.params;
  const { price, costPrice } = req.body;

  const product = await Products.findById(id);
  if (!product) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Product not found" });
  }

  // Robust numeric validation
  if (price !== undefined || costPrice !== undefined) {
      const checkPrice = Number(price !== undefined ? price : product.price);
      const checkCost = Number(costPrice !== undefined ? costPrice : product.costPrice);

      if (isNaN(checkPrice) || isNaN(checkCost)) {
          return res.status(StatusCodes.BAD_REQUEST).json({ message: "Price and Cost must be valid numbers" });
      }

      if (checkPrice <= checkCost) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          message: "Price must be greater than cost price",
        });
      }
  }

  const updatedProduct = await Products.findByIdAndUpdate(id, req.body, {
    new: true,
  }).populate("categoryId", "name").populate("supplierId", "name");

  res.status(StatusCodes.OK).json({
    message: "Product updated successfully",
    product: updatedProduct,
  });
};

const deleteProduct = async (req, res) => {
  const { id } = req.params;

  const product = await Products.findByIdAndDelete(id);

  if (!product) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Product not found" });
  }

  res.status(StatusCodes.OK).json({
    message: "Product deleted successfully",
  });
};

export {
  addProduct,
  getProducts,
  getSingleProduct,
  updateProduct,
  deleteProduct,
};
