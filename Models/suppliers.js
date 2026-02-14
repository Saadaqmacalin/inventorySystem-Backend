import { Schema, model } from "mongoose";

const suppliersSchema = new Schema(
  {
    companyName: { 
      type: String,
      required: [true, "Company name is required"],
      trim: true,
      unique: true,
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please fill a valid email address",
      ],
    },
    phone: {
      type: String,
      unique:true,
      required: [true, "Phone number is required"],
    },

    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: { type: String, default: "SO" },
    },

    category: {  
      type: [String], // e.g., ['Raw Materials', 'Electronics', 'Packaging']
      required: true,
    },
    status: {
      type: String,
      enum: ["Active", "Inactive", "Pending", "Blacklisted"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

export default model("Supplier", suppliersSchema);
