import {formatDate} from './dateFormatter.js';
const formatTimestamps = (obj) => {
  if (!obj) return obj;
  if (obj instanceof Date) return formatDate(obj);

  if (Array.isArray(obj)) {
    return obj.map(formatTimestamps);
  }

  if (typeof obj === "object") {
    const formatted = { ...obj };
    Object.keys(formatted).forEach((key) => {
      if (formatted[key] instanceof Date) {
        formatted[key] = formatDate(formatted[key]);
      } else if (Array.isArray(formatted[key])) {
        formatted[key] = formatted[key].map(formatTimestamps);
      } else if (typeof formatted[key] === "object" && formatted[key] !== null) {
        formatted[key] = formatTimestamps(formatted[key]);
      }
    });
    return formatted;
  }

  return obj;
};

export default formatTimestamps;