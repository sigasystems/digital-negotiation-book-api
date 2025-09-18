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