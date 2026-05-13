export const formatDate = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  // Handle Neo4j Integer objects
  const normalized =
    typeof value === "object" && value !== null &&
    typeof (value as { toNumber?: () => number }).toNumber === "function"
      ? (value as { toNumber: () => number }).toNumber()
      : value;

  const date = new Date(normalized as string | number);
  
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return date.toLocaleDateString();
};

export const formatDateTime = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  const normalized =
    typeof value === "object" && value !== null &&
    typeof (value as { toNumber?: () => number }).toNumber === "function"
      ? (value as { toNumber: () => number }).toNumber()
      : value;

  const date = new Date(normalized as string | number);
  
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};
