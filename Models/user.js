import mongoose, { Schema, model } from "mongoose"; // Import mongoose to access .models
import { genSalt, hash, compare } from "bcrypt";
import jwt from 'jsonwebtoken';

const userSchema = new Schema(
  {
    name: {
      type: String,
      minlength: 3,
      maxlength: 50,
      required: [true, "name must be provided"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      required: [true, "email must be provided"],
      trim: true,
    },
    password: {
      type: String,
      minlength: 8,
      required: [true, "password must be provided"],
    },
    status: {
      type: String,
      enum: ["ADMIN", "USER"],
      default: "USER",
    },
    profile: {
      type: Schema.Types.ObjectId,
      ref: "Profile",
    },
    purchases: [{ type: Schema.Types.ObjectId, ref: "Purchase" }],
    sales: [{ type: Schema.Types.ObjectId, ref: "Sale" }],
    orders: [{ type: Schema.Types.ObjectId, ref: "Order" }],
    reports: [{ type: Schema.Types.ObjectId, ref: "Report" }],
    helpRequests: [{ type: Schema.Types.ObjectId, ref: "Help" }],
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) { 
  if (!this.isModified("password")) return next();
  const salt = await genSalt(10);
  this.password = await hash(this.password, salt);
});

// Compare password
userSchema.methods.comparePassword = async function (reqPassword) {
  return await compare(reqPassword, this.password);
};

// Create JWT
userSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
      name: this.name,
      status: this.status,
    },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
};

// --- FIXED EXPORT SECTION ---
// Checks if the model already exists before creating it
const Users = mongoose.models.Users || model("Users", userSchema);

export default Users;