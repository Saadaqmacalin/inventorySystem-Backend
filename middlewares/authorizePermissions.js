import { StatusCodes } from "http-status-codes";

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    // req.user is populated by authenticationHeader
    if (!req.user || !roles.includes(req.user.status)) {
      return res
        .status(StatusCodes.FORBIDDEN)
        .json({ message: "Unauthorized to perform this action" });
    }
    next();
  };
};

export default authorizePermissions;
