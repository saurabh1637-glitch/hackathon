export const VEHICLE_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  IN_SHOP: 'In Shop',
  RETIRED: 'Retired',
};

export const DRIVER_STATUS = {
  AVAILABLE: 'Available',
  ON_TRIP: 'On Trip',
  OFF_DUTY: 'Off Duty',
  SUSPENDED: 'Suspended',
};

export const TRIP_STATUS = {
  DRAFT: 'Draft',
  DISPATCHED: 'Dispatched',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const MAINT_STATUS = {
  OPEN: 'Open',
  CLOSED: 'Closed',
};

export const VEHICLE_TYPES = ['Truck', 'Mini Truck', 'Van', 'Trailer', 'Tanker'];
export const LICENSE_CATEGORIES = ['LMV', 'HMV', 'HGMV', 'HTV'];
export const EXPENSE_CATEGORIES = ['Toll', 'Parking', 'Driver Allowance', 'Repair', 'Insurance', 'Permit', 'Other'];

export const NAV_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/vehicles', label: 'Vehicles' },
  { path: '/drivers', label: 'Drivers' },
  { path: '/trips', label: 'Trips' },
  { path: '/maintenance', label: 'Maintenance' },
  { path: '/fuel', label: 'Fuel & Expenses' },
  { path: '/reports', label: 'Reports' },
  { path: '/settings', label: 'Settings' },
];

export const CHART_COLORS = {
  'Available': '#10b981',
  'On Trip': '#2563eb',
  'In Shop': '#f59e0b',
  'Retired': '#94a3b8',
};
