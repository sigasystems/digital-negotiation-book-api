const roleDisplayNames = {
  super_admin: "Super Admin",
  business_owner: "Business Owner",
  manager: "Manager",
  support_staff: "Support Staff",
  buyer: "Buyer",
  guest: "Guest",
};

export const authorizeRoles = (req, allowedRoles = []) => {
  const userRole = req.user?.userRole;

  if (!userRole || !allowedRoles.includes(userRole)) {
    const allowedDisplay = allowedRoles
      .map((role) => roleDisplayNames[role] || role)
      .join(", ");
    const err = new Error(`Access denied. Only ${allowedDisplay} can perform this action.`);
    err.statusCode = 403;
    throw err;
  }

  return true;
};
