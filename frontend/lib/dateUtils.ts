export const formatDate = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  // Handle Neo4j Integer objects (both with toNumber() and raw {low, high})
  let normalized: any = value;
  if (typeof value === "object" && value !== null) {
    if (typeof (value as any).toNumber === "function") {
      normalized = (value as any).toNumber();
    } else if ('low' in (value as any) && 'high' in (value as any)) {
      const { low, high } = value as { low: number; high: number };
      // Standard Neo4j Integer reconstruction
      normalized = high * Math.pow(2, 32) + (low < 0 ? low + Math.pow(2, 32) : low);
    }
  }

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

  let normalized: any = value;
  if (typeof value === "object" && value !== null) {
    if (typeof (value as any).toNumber === "function") {
      normalized = (value as any).toNumber();
    } else if ('low' in (value as any) && 'high' in (value as any)) {
      const { low, high } = value as { low: number; high: number };
      normalized = high * Math.pow(2, 32) + (low < 0 ? low + Math.pow(2, 32) : low);
    }
  }

  const date = new Date(normalized as string | number);
  
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};
