import User from "../Models/user.js";
import jwt from "jsonwebtoken"; // Replaced require with import

const authenticationHeader = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // Check if header exists and starts with Bearer
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "Authentication invalid" });
  }

  const token = authHeader.split(" ")[1];

  try {
    // Use jwt.verify instead of just verify
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Attach user data to the request object
    req.user = { userId: decoded.userId, name: decoded.name, status: decoded.status };
    
    next();
  } catch (error) {
    return res.status(401).json({ msg: "Authentication invalid" });
  }
};

export default authenticationHeader;