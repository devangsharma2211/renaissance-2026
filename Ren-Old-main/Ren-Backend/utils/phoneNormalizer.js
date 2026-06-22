export const normalizePhone = (input) => {
  if (!input) return null;
  const digits = String(input).replace(/\D/g, "");
  if (!digits) return null;
  // Accept only 10-digit numbers
  if (digits.length !== 10) return null;
  return digits;
};

export default normalizePhone;
