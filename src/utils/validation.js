import {
  VEHICLE_STATUS as VS,
  TRIP_STATUS as TS,
  VEHICLE_TYPES,
  LICENSE_CATEGORIES,
  EXPENSE_CATEGORIES,
} from './constants.js';

const REG_RE = /^[A-Z]{2}\d{1,2}[A-Z]{1,3}\d{4}$/;
const PHONE_RE = /^[6-9]\d{9}$/;

export const normalizeReg = (value = '') => value.replace(/[\s-]+/g, '').toUpperCase();
const num = (v) => (v === '' || v === null || v === undefined ? NaN : Number(v));

export const validateVehicle = (f, vehicles, editingId) => {
  const errors = [];
  const reg = normalizeReg(f.regNo);
  if (!reg) errors.push('Registration number is required.');
  else if (!REG_RE.test(reg)) errors.push('Registration must look like MH12AB1234 (state, district, series, number).');
  else if (vehicles.some((v) => v.regNo === reg && v.id !== editingId)) errors.push(`Registration ${reg} already exists.`);
  if (!f.name?.trim()) errors.push('Name / model is required.');
  if (!VEHICLE_TYPES.includes(f.type)) errors.push('Choose a valid vehicle type.');
  if (!(num(f.capacityKg) > 0)) errors.push('Maximum load capacity must be greater than 0 kg.');
  if (!(num(f.odometer) >= 0)) errors.push('Odometer must be 0 or more.');
  if (!(num(f.acquisitionCost) >= 0)) errors.push('Acquisition cost must be 0 or more.');
  return errors;
};

export const validateDriver = (f, drivers, editingId) => {
  const errors = [];
  const lic = String(f.licenseNo || '').replace(/\s+/g, '').toUpperCase();
  if (!f.name?.trim()) errors.push('Driver name is required.');
  if (lic.length < 6) errors.push('License number must be at least 6 characters.');
  else if (drivers.some((d) => d.licenseNo === lic && d.id !== editingId)) errors.push(`License ${lic} is already registered.`);
  if (!LICENSE_CATEGORIES.includes(f.licenseCategory)) errors.push('Choose a valid license category.');
  if (!f.licenseExpiry) errors.push('License expiry date is required.');
  if (!PHONE_RE.test(String(f.contact || '').replace(/\s+/g, ''))) errors.push('Enter a valid 10-digit Indian mobile number.');
  if (!(num(f.safetyScore) >= 0 && num(f.safetyScore) <= 100)) errors.push('Safety score must be between 0 and 100.');
  return errors;
};

export const validateTrip = (f) => {
  const errors = [];
  if (!f.source?.trim()) errors.push('Source is required.');
  if (!f.destination?.trim()) errors.push('Destination is required.');
  if (f.source?.trim() && f.destination?.trim() && f.source.trim().toLowerCase() === f.destination.trim().toLowerCase()) {
    errors.push('Source and destination must be different.');
  }
  if (!(num(f.cargoKg) > 0)) errors.push('Cargo weight must be greater than 0 kg.');
  if (!(num(f.distanceKm) > 0)) errors.push('Planned distance must be greater than 0 km.');
  if (!f.startTime) errors.push('Start time is required.');
  return errors;
};

export const validateMaintenance = (f, data) => {
  const errors = [];
  const vehicle = data.vehicles.find((v) => v.id === f.vehicleId);
  if (!vehicle) errors.push('Select a vehicle.');
  if (!f.issue?.trim()) errors.push('Describe the issue.');
  if (!f.date) errors.push('Date is required.');
  if (!(num(f.cost) >= 0)) errors.push('Cost must be 0 or more.');
  if (vehicle?.status === VS.RETIRED) errors.push(`${vehicle.regNo} is Retired and cannot receive maintenance.`);
  if (vehicle && data.trips.some((t) => t.vehicleId === vehicle.id && t.status === TS.DISPATCHED)) {
    errors.push(`${vehicle.regNo} is on an active trip. Complete or cancel the trip first.`);
  }
  return errors;
};

export const validateFuel = (f) => {
  const errors = [];
  if (!f.vehicleId) errors.push('Select a vehicle.');
  if (!f.date) errors.push('Date is required.');
  if (!(num(f.litres) > 0)) errors.push('Litres must be greater than 0.');
  if (!(num(f.pricePerLitre) > 0)) errors.push('Price per litre must be greater than 0.');
  if (!(num(f.odometer) >= 0)) errors.push('Odometer reading is required.');
  return errors;
};

export const validateExpense = (f) => {
  const errors = [];
  if (!EXPENSE_CATEGORIES.includes(f.category)) errors.push('Choose a valid category.');
  if (!(num(f.amount) > 0)) errors.push('Amount must be greater than 0.');
  if (!f.date) errors.push('Date is required.');
  return errors;
};
