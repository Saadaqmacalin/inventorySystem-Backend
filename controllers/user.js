import { StatusCodes } from "http-status-codes";
import Users from "../Models/user.js";

// 1. REGISTER USER
const registerUser = async (req, res) => {
  try {
    const { name, email, status, password } = req.body || {};
    
    // Check all fields
    if (!name || !email || !status || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Name, email, status (ADMIN/USER), and password must be provided" });
    }

    const exists = await Users.findOne({ email });
    if (exists) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "User already exists" });
    }

    // Password auto-hashing should be handled in your User Schema Middleware
    // Ensure we pass lowercase 'status' to model
    const user = await Users.create({ name, email, status, password });
    const token = user.createJWT(); // Call on instance, usually not awaited unless it's a custom async function

    res.status(StatusCodes.CREATED).json({ message: "User created successfully", token });
  } catch (error) {
    console.error("Error occurred while registering a user", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong while registering a user" });
  }
};

// 2. GET ALL USERS
const getAllUsers = async (req, res) => {
  try {
    // FIXED: Must call find() on the 'Users' model
    const users = await Users.find({}, { password: 0 }); 
    
    if (users.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "No users found" });
    }
    res.status(StatusCodes.OK).json({ totalUsers: users.length, users });
  } catch (error) {
    console.error("Error occurred while fetching users", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong while fetching users" });
  }
};

// 3. GET SINGLE USER
const getSingleUser = async (req, res) => {
  try {
    const { id } = req.params;
    // FIXED: Must call findById on 'Users'
    const user = await Users.findById(id).select("-password");
    
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "User not Found" });
    }
    res.status(StatusCodes.OK).json({ user });
  } catch (error) {
    console.error("Error occurred while fetching a user", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong while fetching a user" });
  }
};

// 4. UPDATE USER
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, status } = req.body;

    if (!name && !email && !password && !status) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Please provide at least one field to update" });
    }

    // FIXED: Must call findByIdAndUpdate on 'Users'
    const user = await Users.findByIdAndUpdate(
      id,
      { name, email, password, status },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "The user you want to update does not exist" });
    }
    res.status(StatusCodes.OK).json({ message: "User updated successfully", user });
  } catch (error) {
    console.error("Error occurred while updating a user", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong while updating the user" });
  }
};

// 5. DELETE USER
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    // FIXED: Must call findByIdAndDelete on 'Users'
    const user = await Users.findByIdAndDelete(id);
    
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "The user you want to delete does not exist" });
    }
    res.status(StatusCodes.OK).json({ message: "User has been deleted" });
  } catch (error) {
    console.error("Error occurred while deleting a user", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong while deleting the user" });
  }
};

// 6. LOGIN
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Email and password are required" });
    }

    // FIXED: Must call findOne on 'Users'
    const user = await Users.findOne({ email });
    if (!user) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid email or password" });
    }

    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ message: "Invalid email or password" });
    }

    const token = user.createJWT();

    res.status(StatusCodes.OK).json({
      message: "Login successful",
      user: {
        name: user.name,
        email: user.email,
        status: user.status, // Matches your schema field name
        id: user._id,
      },
      token,
    });
  } catch (error) {
    console.error("Error occurred while logging in:", error);
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong while trying to log in" });
  }
};

// 7. RESET PASSWORD
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ message: "Please provide email and password" });
    }

    // FIXED: Must call findOne on 'Users'
    const user = await Users.findOne({ email });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "No user found with this email" });
    }

    user.password = password;
    await user.save(); // This triggers 'pre-save' hooks for hashing

    const token = user.createJWT();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Password updated successfully",
      token,
    });
  } catch (error) {
    res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Reset failed" });
  }
};

export {
  registerUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  login,
  resetPassword,
};