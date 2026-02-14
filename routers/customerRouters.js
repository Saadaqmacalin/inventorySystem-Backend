import { Router } from "express";
import { 
    registerCustomer, 
    loginCustomer, 
    getCustomerProfile 
} from "../controllers/customerAuthController.js";
import { 
    placeCustomerOrder, 
    getMyOrders 
} from "../controllers/customerOrderController.js";
import authenticationHeader from "../middlewares/authenticationHeader.js";

const router = Router();

// Public routes
router.post("/register", registerCustomer);
router.post("/login", loginCustomer);

// Protected routes
router.get("/profile", authenticationHeader, getCustomerProfile);
router.post("/orders", authenticationHeader, placeCustomerOrder);
router.get("/my-orders", authenticationHeader, getMyOrders);

export default router;
