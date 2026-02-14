import { Router } from "express";
const router = Router();

import {
  registerUser,
  getAllUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  login,
  resetPassword,
} from "../controllers/user.js";

import authenticationHeader from "../middlewares/authenticationHeader.js";
import authorizePermissions from "../middlewares/authorizePermissions.js";

router.route("/").post(registerUser).get(authenticationHeader, authorizePermissions("ADMIN", "USER"), getAllUsers);
router.route("/login").post(login);
router.route("/resetpassword").patch(resetPassword);
router.route("/:id").get(authenticationHeader, getSingleUser).patch(authenticationHeader, authorizePermissions("ADMIN"), updateUser).delete(authenticationHeader, authorizePermissions("ADMIN"), deleteUser);

export default router;
