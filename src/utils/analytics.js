import { TRIP_STATUS as TS } from './constants.js';

// Dates are compared on the YYYY-MM-DD part only, so datetime values work too.
const inRange = (value, from, to) => {
  const day = String(value || '').slice(0, 10);
  return (!from || day >= from) && (!to || day <= to);
};

export const filterByDate = (items, from, to, key = 'date') =>
  items.filter((item) => inRange(item[key], from, to));

export const sumBy = (items, key) => items.reduce((s, item) => s + Number(item[key] || 0), 0);

// Fuel efficiency (km per litre) from odometer readings in the selected range.
export const fuelEfficiency = (fuel, vehicles, from, to) =>
  vehicles
    .map((v) => {
      const entries = filterByDate(fuel.filter((f) => f.vehicleId === v.id), from, to)
        .sort((a, b) => a.odometer - b.odometer);
      if (entries.length < 2) return { vehicleId: v.id, regNo: v.regNo, kmpl: null };
      const distance = entries[entries.length - 1].odometer - entries[0].odometer;
      const litres = entries.slice(1).reduce((s, e) => s + Number(e.litres), 0);
      return { vehicleId: v.id, regNo: v.regNo, kmpl: distance > 0 && litres > 0 ? distance / litres : null };
    })
    .filter((row) => row.kmpl !== null);

// Share of started trips (dispatched, completed or cancelled) that were completed.
export const tripCompletion = (trips, from, to) => {
  const started = filterByDate(trips, from, to, 'startTime').filter((t) =>
    [TS.DISPATCHED, TS.COMPLETED, TS.CANCELLED].includes(t.status)
  );
  const completed = started.filter((t) => t.status === TS.COMPLETED).length;
  return {
    started: started.length,
    completed,
    rate: started.length ? Math.round((completed / started.length) * 100) : 0,
  };
};
