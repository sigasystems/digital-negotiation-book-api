export const formatDate = (date) => {
  if (!date) return null;

  return new Intl.DateTimeFormat("en-IN", {
    weekday: "short",    // Thu
    day: "2-digit",      // 04
    month: "short",      // Sep
    year: "numeric",     // 2025
    hour: "2-digit",     // 11
    minute: "2-digit",   // 20
    second: "2-digit",   // 38
    hour12: true,        // AM/PM format
    timeZoneName: "short" // IST
  }).format(new Date(date));
};

export const formatOfferDates = (offer) => {
  if (!offer) return null;
  const formatted = { ...offer.toJSON() }; // Convert Sequelize instance to plain object

  // System fields with full date & time
  const dateTimeFields = ["createdAt", "updatedAt", "deletedAt"];
  dateTimeFields.forEach((field) => {
    if (formatted[field]) formatted[field] = formatDate(formatted[field]);
  });

  // Only-date fields
  const onlyDateFields = ["offerValidityDate", "shipmentDate"];
  onlyDateFields.forEach((field) => {
    if (formatted[field]) {
      // Format to only date, e.g., "Fri, 31 Oct, 2025"
      formatted[field] = new Date(formatted[field]).toLocaleDateString("en-US", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
  });

  return formatted;
};

export const validateSizeBreakups = (sizeBreakups, total, grandTotal) => {
  // If sizeBreakups is not provided or not an array, skip validation
  if (!Array.isArray(sizeBreakups)) return null;

  const sumBreakups = sizeBreakups.reduce(
    (sum, item) => sum + Number(item?.breakup || 0),
    0
  );

  if (sumBreakups !== Number(total) || sumBreakups !== Number(grandTotal)) {
    return `Validation failed: Sum of all size breakups (${sumBreakups}) does not equal total (${total}) or grand total (${grandTotal})`;
  }

  return null; // Valid
};
