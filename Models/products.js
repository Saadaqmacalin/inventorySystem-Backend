import { Schema, model } from "mongoose";

const productSchema = new Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // Allow nulls for existing records
    },

    categoryId: {
      type: Schema.Types.ObjectId,
      ref: "Category",

      required: [true, "category Id must be provided "],
    },

    supplierId: {
      type: Schema.Types.ObjectId,
      ref: "Supplier",
      required: [true, "supplier Id must be provided "],
    },

    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },

    costPrice: {
      type: Number,
      required: true,
      min: [0.01, "the price must be greaterthan zero "],
    },
    quantity: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  {
    timestamps: true,
  }
);

export default model("Product", productSchema);
