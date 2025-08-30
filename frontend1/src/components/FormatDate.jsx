// FormatDate.jsx
export const FormatDate = (dateString) => {
  if (!dateString) return "No date";

  const date = new Date(dateString.replace(" ", "T"));
  if (isNaN(date.getTime())) return "Invalid Date";

  return date
    .toLocaleString("en-GB", { year: "numeric", month: "long", day: "2-digit" })
    .replace(",", "");
};
