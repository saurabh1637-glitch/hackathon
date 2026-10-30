import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { createDemoData } from '../utils/demoData.js';
import { nextId, syncStatuses, validateDispatch } from '../utils/rules.js';
import {
  normalizeReg,
  validateVehicle,
  validateDriver,
  validateTrip,
  validateMaintenance,
  validateFuel,
  validateExpense,
} from '../utils/validation.js';
import { VEHICLE_STATUS as VS, DRIVER_STATUS as DS, TRIP_STATUS as TS, MAINT_STATUS as MS } from '../utils/constants.js';

const STORAGE_KEY = 'transitops-demo-v1';
const AppContext = createContext(null);

const loadData = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.vehicles)) {
        return syncStatuses({ ...createDemoData(), ...parsed });
      }
    }
  } catch {
    // Corrupted storage: fall back to demo data below.
  }
  return syncStatuses(createDemoData());
};

const fail = (errors) => ({ ok: false, errors });
const succeed = () => ({ ok: true, errors: [] });
const round2 = (n) => Math.round(n * 100) / 100;

export function AppProvider({ children }) {
  const [data, setData] = useState(loadData);
  const [toasts, setToasts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', data.settings.theme);
  }, [data.settings.theme]);

  const dismissToast = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    (message, type = 'success') => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((t) => [...t, { id, message, type }]);
      setTimeout(() => dismissToast(id), 4000);
    },
    [dismissToast]
  );

  const commit = (next) => setData(syncStatuses(next));

  // ---------- Vehicles ----------
  const saveVehicle = (form, id) => {
    const errors = validateVehicle(form, data.vehicles, id);
    if (id && form.status === VS.RETIRED && data.trips.some((t) => t.vehicleId === id && t.status === TS.DISPATCHED)) {
      errors.push('This vehicle is on an active trip. Complete or cancel the trip before retiring it.');
    }
    if (errors.length) return fail(errors);

    const record = {
      regNo: normalizeReg(form.regNo),
      name: form.name.trim(),
      type: form.type,
      capacityKg: Number(form.capacityKg),
      odometer: Number(form.odometer),
      acquisitionCost: Number(form.acquisitionCost),
      status: form.status === VS.RETIRED ? VS.RETIRED : VS.AVAILABLE,
    };

    commit(
      id
        ? { ...data, vehicles: data.vehicles.map((v) => (v.id === id ? { ...v, ...record } : v)) }
        : { ...data, vehicles: [...data.vehicles, { id: nextId(data.vehicles, 'VEH'), ...record }] }
    );
    return succeed();
  };

  const deleteVehicle = (id) => {
    if (data.trips.some((t) => t.vehicleId === id && (t.status === TS.DRAFT || t.status === TS.DISPATCHED))) {
      return fail(['This vehicle is linked to a Draft or Dispatched trip. Cancel or complete that trip first.']);
    }
    if (data.maintenance.some((m) => m.vehicleId === id && m.status === MS.OPEN)) {
      return fail(['This vehicle has open maintenance. Close the maintenance record first.']);
    }
    commit({ ...data, vehicles: data.vehicles.filter((v) => v.id !== id) });
    return succeed();
  };

  // ---------- Drivers ----------
  const saveDriver = (form, id) => {
    const errors = validateDriver(form, data.drivers, id);
    if (id && (form.status === DS.SUSPENDED || form.status === DS.OFF_DUTY) &&
        data.trips.some((t) => t.driverId === id && t.status === TS.DISPATCHED)) {
      errors.push('This driver is on an active trip. Complete or cancel the trip first.');
    }
    if (errors.length) return fail(errors);

    const record = {
      name: form.name.trim(),
      licenseNo: String(form.licenseNo).replace(/\s+/g, '').toUpperCase(),
      licenseCategory: form.licenseCategory,
      licenseExpiry: form.licenseExpiry,
      contact: String(form.contact).replace(/\s+/g, ''),
      safetyScore: Number(form.safetyScore),
      status: form.status === DS.SUSPENDED || form.status === DS.OFF_DUTY ? form.status : DS.AVAILABLE,
    };

    commit(
      id
        ? { ...data, drivers: data.drivers.map((d) => (d.id === id ? { ...d, ...record } : d)) }
        : { ...data, drivers: [...data.drivers, { id: nextId(data.drivers, 'DRV'), ...record }] }
    );
    return succeed();
  };

  const deleteDriver = (id) => {
    if (data.trips.some((t) => t.driverId === id && (t.status === TS.DRAFT || t.status === TS.DISPATCHED))) {
      return fail(['This driver is linked to a Draft or Dispatched trip. Cancel or complete that trip first.']);
    }
    commit({ ...data, drivers: data.drivers.filter((d) => d.id !== id) });
    return succeed();
  };

  // ---------- Trips ----------
  const saveTrip = (form, id) => {
    const errors = validateTrip(form);
    if (id) {
      const current = data.trips.find((t) => t.id === id);
      if (!current || current.status !== TS.DRAFT) errors.push('Only Draft trips can be edited.');
    }
    if (errors.length) return fail(errors);

    const record = {
      source: form.source.trim(),
      destination: form.destination.trim(),
      vehicleId: form.vehicleId || null,
      driverId: form.driverId || null,
      cargoKg: Number(form.cargoKg),
      distanceKm: Number(form.distanceKm),
      startTime: form.startTime,
    };

    commit(
      id
        ? { ...data, trips: data.trips.map((t) => (t.id === id ? { ...t, ...record } : t)) }
        : { ...data, trips: [...data.trips, { id: nextId(data.trips, 'TRP', 4), ...record, status: TS.DRAFT }] }
    );
    return succeed();
  };

  const dispatchTrip = (id) => {
    const trip = data.trips.find((t) => t.id === id);
    if (!trip || trip.status !== TS.DRAFT) return fail(['Only Draft trips can be dispatched.']);
    const errors = validateDispatch(trip, data);
    if (errors.length) return fail(errors);
    commit({ ...data, trips: data.trips.map((t) => (t.id === id ? { ...t, status: TS.DISPATCHED } : t)) });
    return succeed();
  };

  const completeTrip = (id) => {
    const trip = data.trips.find((t) => t.id === id);
    if (!trip || trip.status !== TS.DISPATCHED) return fail(['Only dispatched trips can be completed.']);
    commit({
      ...data,
      trips: data.trips.map((t) => (t.id === id ? { ...t, status: TS.COMPLETED } : t)),
      vehicles: data.vehicles.map((v) =>
        v.id === trip.vehicleId ? { ...v, odometer: v.odometer + Number(trip.distanceKm) } : v
      ),
    });
    return succeed();
  };

  const cancelTrip = (id) => {
    const trip = data.trips.find((t) => t.id === id);
    if (!trip || (trip.status !== TS.DRAFT && trip.status !== TS.DISPATCHED)) {
      return fail(['Only Draft or Dispatched trips can be cancelled.']);
    }
    commit({ ...data, trips: data.trips.map((t) => (t.id === id ? { ...t, status: TS.CANCELLED } : t)) });
    return succeed();
  };

  // ---------- Maintenance ----------
  const saveMaintenance = (form) => {
    const errors = validateMaintenance(form, data);
    if (errors.length) return fail(errors);
    commit({
      ...data,
      maintenance: [
        ...data.maintenance,
        {
          id: nextId(data.maintenance, 'MNT'),
          vehicleId: form.vehicleId,
          issue: form.issue.trim(),
          date: form.date,
          cost: Number(form.cost),
          notes: form.notes?.trim() || '',
          status: MS.OPEN,
        },
      ],
    });
    return succeed();
  };

  const closeMaintenance = (id) => {
    commit({ ...data, maintenance: data.maintenance.map((m) => (m.id === id ? { ...m, status: MS.CLOSED } : m)) });
    return succeed();
  };

  // ---------- Fuel & expenses ----------
  const addFuel = (form) => {
    const errors = validateFuel(form);
    if (errors.length) return fail(errors);
    const litres = Number(form.litres);
    const price = Number(form.pricePerLitre);
    const odometer = Number(form.odometer);
    commit({
      ...data,
      fuel: [
        ...data.fuel,
        { id: nextId(data.fuel, 'FUL'), vehicleId: form.vehicleId, date: form.date, litres, pricePerLitre: price, odometer, totalCost: round2(litres * price) },
      ],
      vehicles: data.vehicles.map((v) => (v.id === form.vehicleId && odometer > v.odometer ? { ...v, odometer } : v)),
    });
    return succeed();
  };

  const deleteFuel = (id) => {
    commit({ ...data, fuel: data.fuel.filter((f) => f.id !== id) });
    return succeed();
  };

  const addExpense = (form) => {
    const errors = validateExpense(form);
    if (errors.length) return fail(errors);
    commit({
      ...data,
      expenses: [
        ...data.expenses,
        {
          id: nextId(data.expenses, 'EXP'),
          category: form.category,
          amount: Number(form.amount),
          date: form.date,
          vehicleId: form.vehicleId || null,
          tripId: form.tripId || null,
          description: form.description?.trim() || '',
        },
      ],
    });
    return succeed();
  };

  const deleteExpense = (id) => {
    commit({ ...data, expenses: data.expenses.filter((e) => e.id !== id) });
    return succeed();
  };

  // ---------- Settings ----------
  const updateSettings = (patch) => commit({ ...data, settings: { ...data.settings, ...patch } });
  const updateProfile = (patch) =>
    updateSettings({ profile: { ...data.settings.profile, ...patch } });
  const resetDemo = () => setData(syncStatuses(createDemoData()));

  const value = {
    data,
    toast,
    toasts,
    dismissToast,
    searchQuery,
    setSearchQuery,
    saveVehicle,
    deleteVehicle,
    saveDriver,
    deleteDriver,
    saveTrip,
    dispatchTrip,
    completeTrip,
    cancelTrip,
    saveMaintenance,
    closeMaintenance,
    addFuel,
    deleteFuel,
    addExpense,
    deleteExpense,
    updateSettings,
    updateProfile,
    resetDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
};
