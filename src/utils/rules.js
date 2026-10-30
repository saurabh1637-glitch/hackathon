import { VEHICLE_STATUS as VS, DRIVER_STATUS as DS, TRIP_STATUS as TS, MAINT_STATUS as MS } from './constants.js';
import { daysUntil, formatDate } from './format.js';

// Creates the next readable ID, e.g. nextId(vehicles, 'VEH') -> 'VEH-007'
export const nextId = (items, prefix, width = 3) => {
  const max = items.reduce((m, item) => {
    const n = parseInt(String(item.id).split('-').pop(), 10);
    return Number.isNaN(n) ? m : Math.max(m, n);
  }, 0);
  return `${prefix}-${String(max + 1).padStart(width, '0')}`;
};

export const licenseState = (expiry, warnDays = 30) => {
  const days = daysUntil(expiry);
  if (days < 0) return 'expired';
  if (days <= warnDays) return 'expiring';
  return 'valid';
};

// Keeps vehicle and driver statuses consistent with trips and maintenance.
// Retired (vehicle) and Off Duty / Suspended (driver) are set manually and kept as they are.
export const syncStatuses = (data) => {
  const dispatched = data.trips.filter((t) => t.status === TS.DISPATCHED);
  const busyVehicles = new Set(dispatched.map((t) => t.vehicleId));
  const busyDrivers = new Set(dispatched.map((t) => t.driverId));
  const shopVehicles = new Set(data.maintenance.filter((m) => m.status === MS.OPEN).map((m) => m.vehicleId));

  const vehicles = data.vehicles.map((v) => {
    if (v.status === VS.RETIRED) return v;
    let status = VS.AVAILABLE;
    if (shopVehicles.has(v.id)) status = VS.IN_SHOP;
    else if (busyVehicles.has(v.id)) status = VS.ON_TRIP;
    return v.status === status ? v : { ...v, status };
  });

  const drivers = data.drivers.map((d) => {
    if (d.status === DS.SUSPENDED || d.status === DS.OFF_DUTY) return d;
    const status = busyDrivers.has(d.id) ? DS.ON_TRIP : DS.AVAILABLE;
    return d.status === status ? d : { ...d, status };
  });

  return { ...data, vehicles, drivers };
};

export const validateDispatch = (trip, data) => {
  const errors = [];
  const vehicle = data.vehicles.find((v) => v.id === trip.vehicleId);
  const driver = data.drivers.find((d) => d.id === trip.driverId);

  if (!vehicle) errors.push('No vehicle is assigned to this trip. Edit the trip and choose one.');
  if (!driver) errors.push('No driver is assigned to this trip. Edit the trip and choose one.');

  if (vehicle) {
    if (vehicle.status === VS.RETIRED) errors.push(`${vehicle.regNo} is Retired and cannot be dispatched.`);
    if (vehicle.status === VS.IN_SHOP) errors.push(`${vehicle.regNo} is In Shop for active maintenance.`);
    if (vehicle.status === VS.ON_TRIP) errors.push(`${vehicle.regNo} is already On Trip.`);
    if (Number(trip.cargoKg) > Number(vehicle.capacityKg)) {
      errors.push(`Cargo of ${trip.cargoKg} kg exceeds ${vehicle.regNo} capacity of ${vehicle.capacityKg} kg.`);
    }
  }

  if (driver) {
    if (driver.status === DS.SUSPENDED) errors.push(`${driver.name} is Suspended.`);
    if (driver.status === DS.OFF_DUTY) errors.push(`${driver.name} is Off Duty.`);
    if (driver.status === DS.ON_TRIP) errors.push(`${driver.name} is already On Trip.`);
    if (licenseState(driver.licenseExpiry) === 'expired') {
      errors.push(`${driver.name}'s license expired on ${formatDate(driver.licenseExpiry)}.`);
    }
  }

  return errors;
};
