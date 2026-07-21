/**
 * Small shared formatting helpers used across dashboard pages.
 */

/** "Ralph Edwards" -> "RE" (max 2 chars, uppercased). */
export function initialsOf(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

/** ISO date string / Date -> "Tue, 19 Mar 2024". Returns fallback when empty. */
export function formatDate(value, fallback = "—") {
  if (!value) return fallback;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "male" -> "Male". Returns fallback when empty. */
export function titleCase(value, fallback = "—") {
  if (!value) return fallback;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
