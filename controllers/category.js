import Categories from "../Models/category.js";
import { StatusCodes } from "http-status-codes";

const addCategory = async (req, res) => {
  const { name } = req.body;
  
  const exists = await Categories.findOne({ name });
  if (exists) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Category already exists" });
  }

  const category = await Categories.create(req.body);
  res.status(StatusCodes.CREATED).json({ message: "Category added successfully", category });
};

const getAllCategories = async (req, res) => {
  const categories = await Categories.find({});
  res.status(StatusCodes.OK).json({ totalCategories: categories.length, categories });
};

const getaSingleCategory = async (req, res) => {
  const { id } = req.params;
  const category = await Categories.findById(id);
  
  if (!category) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Category not found" });
  }
  
  res.status(StatusCodes.OK).json({ category });
};

const updateCategory = async (req, res) => {
  const { id } = req.params;
  
  const category = await Categories.findByIdAndUpdate(
    id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!category) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Category not found" });
  }

  res.status(StatusCodes.OK).json({ message: "Category updated", category });
};

const deleteCategory = async (req, res) => {
  const { id } = req.params;
  const category = await Categories.findByIdAndDelete(id);
  
  if (!category) {
    return res.status(StatusCodes.NOT_FOUND).json({ message: "Category not found" });
  }

  res.status(StatusCodes.OK).json({ message: "Category deleted successfully" });
};

export {
  addCategory,
  getAllCategories,
  getaSingleCategory,
  updateCategory,
  deleteCategory
};
