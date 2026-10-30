import { VEHICLE_STATUS as VS, DRIVER_STATUS as DS, TRIP_STATUS as TS, MAINT_STATUS as MS } from './constants.js';

// Demo-only trend numbers (not calculated from records).
export const DEMO_TREND = [
  { day: 'Oct 24', utilization: 58 },
  { day: 'Oct 25', utilization: 62 },
  { day: 'Oct 26', utilization: 55 },
  { day: 'Oct 27', utilization: 71 },
  { day: 'Oct 28', utilization: 68 },
  { day: 'Oct 29', utilization: 74 },
  { day: 'Oct 30', utilization: 66 },
];

// Fresh copy of the sample data. Used on first load and by "Reset demo data".
export const createDemoData = () => ({
  vehicles: [
    { id: 'VEH-001', regNo: 'MH12AB1234', name: 'Tata Ultra 1918', type: 'Truck', capacityKg: 9000, odometer: 84210, acquisitionCost: 2850000, status: VS.AVAILABLE },
    { id: 'VEH-002', regNo: 'MH14CD5678', name: 'Ashok Leyland Dost', type: 'Mini Truck', capacityKg: 1500, odometer: 32110, acquisitionCost: 1020000, status: VS.ON_TRIP },
    { id: 'VEH-003', regNo: 'KA01EF9012', name: 'Eicher Pro 3019', type: 'Truck', capacityKg: 12000, odometer: 120530, acquisitionCost: 3400000, status: VS.IN_SHOP },
    { id: 'VEH-004', regNo: 'DL08GH3456', name: 'Mahindra Supro', type: 'Van', capacityKg: 800, odometer: 56700, acquisitionCost: 780000, status: VS.AVAILABLE },
    { id: 'VEH-005', regNo: 'TN09JK7890', name: 'Tata Signa 4825', type: 'Trailer', capacityKg: 25000, odometer: 198400, acquisitionCost: 4800000, status: VS.AVAILABLE },
    { id: 'VEH-006', regNo: 'GJ05LM2468', name: 'Force Traveller Cargo', type: 'Van', capacityKg: 1200, odometer: 15600, acquisitionCost: 1350000, status: VS.RETIRED },
    { id: 'VEH-007', regNo: 'UP32NP1357', name: 'BharatBenz 1617', type: 'Tanker', capacityKg: 16000, odometer: 143000, acquisitionCost: 3100000, status: VS.AVAILABLE },
  ],
  drivers: [
    { id: 'DRV-001', name: 'Rajesh Kumar', licenseNo: 'MH1220190012345', licenseCategory: 'HMV', licenseExpiry: '2028-06-15', contact: '9876543210', safetyScore: 92, status: DS.AVAILABLE },
    { id: 'DRV-002', name: 'Amit Sharma', licenseNo: 'DL0820180098765', licenseCategory: 'HGMV', licenseExpiry: '2026-11-20', contact: '9123456780', safetyScore: 88, status: DS.ON_TRIP },
    { id: 'DRV-003', name: 'Suresh Patil', licenseNo: 'KA0120170055511', licenseCategory: 'LMV', licenseExpiry: '2026-08-01', contact: '9988776655', safetyScore: 74, status: DS.AVAILABLE },
    { id: 'DRV-004', name: 'Mohammed Irfan', licenseNo: 'TN0920210033322', licenseCategory: 'HMV', licenseExpiry: '2029-03-10', contact: '9812345670', safetyScore: 95, status: DS.OFF_DUTY },
    { id: 'DRV-005', name: 'Priya Nair', licenseNo: 'KL0720200044455', licenseCategory: 'LMV', licenseExpiry: '2027-09-30', contact: '9845012345', safetyScore: 81, status: DS.AVAILABLE },
    { id: 'DRV-006', name: 'Vikram Singh', licenseNo: 'UP3220160077788', licenseCategory: 'HGMV', licenseExpiry: '2026-12-05', contact: '9700011122', safetyScore: 60, status: DS.SUSPENDED },
  ],
  trips: [
    { id: 'TRP-1001', source: 'Mumbai', destination: 'Pune', vehicleId: 'VEH-002', driverId: 'DRV-002', cargoKg: 1200, distanceKm: 150, startTime: '2026-10-30T08:00', status: TS.DISPATCHED },
    { id: 'TRP-1002', source: 'Delhi', destination: 'Jaipur', vehicleId: 'VEH-004', driverId: 'DRV-005', cargoKg: 600, distanceKm: 280, startTime: '2026-10-28T06:30', status: TS.COMPLETED },
    { id: 'TRP-1003', source: 'Chennai', destination: 'Bengaluru', vehicleId: 'VEH-005', driverId: 'DRV-001', cargoKg: 18000, distanceKm: 350, startTime: '2026-10-31T09:00', status: TS.DRAFT },
    { id: 'TRP-1004', source: 'Bengaluru', destination: 'Hyderabad', vehicleId: 'VEH-007', driverId: 'DRV-003', cargoKg: 9000, distanceKm: 570, startTime: '2026-10-25T14:00', status: TS.CANCELLED },
  ],
  maintenance: [
    { id: 'MNT-001', vehicleId: 'VEH-003', issue: 'Clutch plate replacement', date: '2026-10-27', cost: 18500, notes: 'Parts ordered from authorised dealer', status: MS.OPEN },
    { id: 'MNT-002', vehicleId: 'VEH-001', issue: 'Brake pad service', date: '2026-10-10', cost: 6200, notes: 'Routine service', status: MS.CLOSED },
    { id: 'MNT-003', vehicleId: 'VEH-006', issue: 'Engine overhaul', date: '2026-09-02', cost: 92000, notes: 'Vehicle marked for retirement after overhaul', status: MS.CLOSED },
  ],
  fuel: [
    { id: 'FUL-001', vehicleId: 'VEH-001', date: '2026-10-05', litres: 180, pricePerLitre: 96.5, odometer: 83100, totalCost: 17370 },
    { id: 'FUL-002', vehicleId: 'VEH-001', date: '2026-10-18', litres: 190, pricePerLitre: 97.2, odometer: 84210, totalCost: 18468 },
    { id: 'FUL-003', vehicleId: 'VEH-002', date: '2026-10-22', litres: 45, pricePerLitre: 95.8, odometer: 31600, totalCost: 4311 },
    { id: 'FUL-004', vehicleId: 'VEH-002', date: '2026-10-29', litres: 52, pricePerLitre: 96.1, odometer: 32110, totalCost: 4997.2 },
    { id: 'FUL-005', vehicleId: 'VEH-005', date: '2026-10-12', litres: 320, pricePerLitre: 96.9, odometer: 196200, totalCost: 31008 },
    { id: 'FUL-006', vehicleId: 'VEH-005', date: '2026-10-26', litres: 300, pricePerLitre: 97.3, odometer: 198400, totalCost: 29190 },
  ],
  expenses: [
    { id: 'EXP-001', category: 'Toll', amount: 1450, date: '2026-10-28', vehicleId: 'VEH-004', tripId: 'TRP-1002', description: 'Highway tolls Delhi–Jaipur' },
    { id: 'EXP-002', category: 'Driver Allowance', amount: 800, date: '2026-10-30', vehicleId: 'VEH-002', tripId: 'TRP-1001', description: 'Daily allowance' },
    { id: 'EXP-003', category: 'Parking', amount: 300, date: '2026-10-14', vehicleId: 'VEH-001', tripId: null, description: 'Depot parking' },
    { id: 'EXP-004', category: 'Permit', amount: 2200, date: '2026-10-01', vehicleId: 'VEH-005', tripId: null, description: 'Interstate permit renewal' },
  ],
  settings: {
    theme: 'light',
    companyName: 'TransitOps Logistics Pvt. Ltd.',
    licenseWarnDays: 30,
    profile: {
      name: 'Arjun Mehta',
      role: 'Fleet Manager',
      email: 'fleet.manager@transitops.in',
      phone: '9876543210',
    },
  },
});
