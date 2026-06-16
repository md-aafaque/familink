import { format, parseISO, isValid } from 'date-fns';

export const formatDate = (value: unknown) => {
  if (value === null || value === undefined || value === "") {
    return "Not provided";
  }

  // Handle Neo4j Integer objects
  let normalized: any = value;
  if (typeof value === "object" && value !== null) {
    if (typeof (value as any).toNumber === "function") {
      normalized = (value as any).toNumber();
    } else if ('low' in (value as any) && 'high' in (value as any)) {
      const { low, high } = value as { low: number; high: number };
      normalized = high * Math.pow(2, 32) + (low < 0 ? low + Math.pow(2, 32) : low);
    }
  }

  // Handle partial date strings
  if (typeof normalized === 'string') {
    const parts = normalized.split('-');
    if (parts.length === 1) { // YYYY
      return parts[0];
    } else if (parts.length === 2) { // YYYY-MM
      const date = parseISO(`${normalized}-01`);
      if (isValid(date)) {
        return format(date, 'MMMM yyyy');
      }
    } else if (parts.length === 3) { // YYYY-MM-DD
      const date = parseISO(normalized);
      if (isValid(date)) {
        return format(date, 'MMMM d, yyyy');
      }
    }
  }

  // Fallback to standard date parsing for timestamps or other formats
  const date = new Date(normalized as string | number);
  if (Number.isNaN(date.getTime())) {
    return "Invalid date";
  }

  return format(date, 'MMMM d, yyyy');
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
