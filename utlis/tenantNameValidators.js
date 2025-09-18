// utils/validators.js (for example)
export function validateTenantName(tenantName) {
  const tenantNameRegex = /^(?=.*[A-Z])[A-Za-z0-9 ]+$/;

  if (!tenantNameRegex.test(tenantName)) {
    return {
      valid: false,
      message: "Tenant name must be alphanumeric and contain at least one capital letter.",
    };
  }

  if (tenantName.length > 50) {
    return {
      valid: false,
      message: "Tenant name must not exceed 50 characters.",
    };
  }

  return { valid: true };
}
