import crypto from "crypto";

export default function generateSecurePassword(length = 12) {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()[]{}<>?/|~`"; // exclude - _ =

  // ensure at least one from each required category
  const mustInclude = [
    upper[Math.floor(Math.random() * upper.length)],
    numbers[Math.floor(Math.random() * numbers.length)],
    symbols[Math.floor(Math.random() * symbols.length)],
  ];

  // fill the rest randomly
  const allChars = upper + lower + numbers + symbols;
  const remainingLength = Math.max(length - mustInclude.length, 5);

  let passwordChars = mustInclude;
  for (let i = 0; i < remainingLength; i++) {
    const byte = crypto.randomBytes(1)[0];
    passwordChars.push(allChars[byte % allChars.length]);
  }

  // shuffle characters
  return passwordChars.sort(() => 0.5 - Math.random()).join("");
}