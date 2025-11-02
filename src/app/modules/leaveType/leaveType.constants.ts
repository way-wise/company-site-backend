export const searchableFields = ["name", "description"];

export const validParams = ["q", "isActive"];

export const DEFAULT_LEAVE_TYPES = [
  {
    name: "SICK",
    description: "Sick leave for medical purposes",
    defaultDaysPerYear: 10,
    requiresDocument: false,
    color: "#F87171",
  },
  {
    name: "CASUAL",
    description: "Casual leave for personal work",
    defaultDaysPerYear: 12,
    requiresDocument: false,
    color: "#60A5FA",
  },
  {
    name: "ANNUAL",
    description: "Annual vacation leave",
    defaultDaysPerYear: 20,
    requiresDocument: false,
    color: "#34D399",
  },
  {
    name: "EMERGENCY",
    description: "Emergency leave for urgent situations",
    defaultDaysPerYear: 0,
    requiresDocument: true,
    color: "#FB923C",
  },
  {
    name: "UNPAID",
    description: "Unpaid leave without salary",
    defaultDaysPerYear: 0,
    requiresDocument: false,
    color: "#A78BFA",
  },
  {
    name: "MATERNITY",
    description: "Maternity leave for new mothers",
    defaultDaysPerYear: 90,
    requiresDocument: true,
    color: "#F9A8D4",
  },
  {
    name: "PATERNITY",
    description: "Paternity leave for new fathers",
    defaultDaysPerYear: 7,
    requiresDocument: true,
    color: "#93C5FD",
  },
];

