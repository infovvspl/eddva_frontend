// initials.js — turns "Amanil Tripathi" into "AT", for avatar placeholders.

export default function getInitials(name = "") {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}
