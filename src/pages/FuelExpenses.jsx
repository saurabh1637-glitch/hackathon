import { useMemo, useState } from 'react';
import { Fuel, Plus, Receipt, Trash2, Wallet } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Field from '../components/Field.jsx';
import ErrorList from '../components/ErrorList.jsx';
import KpiCard from '../components/KpiCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { EXPENSE_CATEGORIES } from '../utils/constants.js';
import { formatDate, formatINR, formatNumber, todayISO } from '../utils/format.js';

const blankFuel = () => ({ vehicleId: '', date: todayISO(), litres: '', pricePerLitre: '', odometer: '' });
const blankExpense = () => ({ category: 'Toll', amount: '', date: todayISO(), vehicleId: '', tripId: '', description: '' });

export default function FuelExpenses() {
  const { data, searchQuery, addFuel, deleteFuel, addExpense, deleteExpense, toast } = useApp();
  const [tab, setTab] = useState('fuel');
  const [vehicleFilter, setVehicleFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [fuelForm, setFuelForm] = useState(blankFuel);
  const [expenseForm, setExpenseForm] = useState(blankExpense);
  const [errors, setErrors] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const vehicleById = useMemo(() => Object.fromEntries(data.vehicles.map((v) => [v.id, v])), [data.vehicles]);
  const tripById = useMemo(() => Object.fromEntries(data.trips.map((t) => [t.id, t])), [data.trips]);

  const totalFuel = data.fuel.reduce((s, f) => s + Number(f.totalCost), 0);
  const totalLitres = data.fuel.reduce((s, f) => s + Number(f.litres), 0);
  const totalExpenses = data.expenses.reduce((s, e) => s + Number(e.amount), 0);

  const q = searchQuery.trim().toLowerCase();
  const vehicleMatch = (vid) => vehicleFilter === 'All' || vid === vehicleFilter;
  const textMatch = (values) => !q || values.some((x) => String(x || '').toLowerCase().includes(q));

  const fuelRows = [...data.fuel]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .filter((f) => vehicleMatch(f.vehicleId) && textMatch([vehicleById[f.vehicleId]?.regNo, f.date]));

  const expenseRows = [...data.expenses]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .filter((e) => (vehicleFilter === 'All' || e.vehicleId === vehicleFilter) &&
      textMatch([e.category, e.description, vehicleById[e.vehicleId]?.regNo, e.tripId]));

  const openForm = () => {
    setErrors([]);
    if (tab === 'fuel') setFuelForm(blankFuel());
    else setExpenseForm(blankExpense());
    setFormOpen(true);
  };

  const save = () => {
    const res = tab === 'fuel' ? addFuel(fuelForm) : addExpense(expenseForm);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    toast(tab === 'fuel' ? 'Fuel entry saved' : 'Expense saved');
    setFormOpen(false);
  };

  const confirmDelete = () => {
    const res = deleteTarget.kind === 'fuel' ? deleteFuel(deleteTarget.id) : deleteExpense(deleteTarget.id);
    toast(res.ok ? 'Record deleted' : res.errors[0], res.ok ? 'success' : 'error');
    setDeleteTarget(null);
  };

  const setF = (key) => (e) => setFuelForm({ ...fuelForm, [key]: e.target.value });
  const setE = (key) => (e) => setExpenseForm({ ...expenseForm, [key]: e.target.value });

  const fuelPreview = (Number(fuelForm.litres) || 0) * (Number(fuelForm.pricePerLitre) || 0);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Fuel & Expenses</h2>
          <p>Record fuel purchases and other operating costs. Totals are calculated from each entry.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-primary" onClick={openForm}>
            <Plus size={16} /> {tab === 'fuel' ? 'Add Fuel Entry' : 'Add Expense'}
          </button>
        </div>
      </div>

      <div className="grid-3">
        <KpiCard label="Total fuel cost" value={formatINR(totalFuel)} icon={Fuel} tone="blue" hint={`${formatNumber(totalLitres, 1)} litres`} />
        <KpiCard label="Other expenses" value={formatINR(totalExpenses)} icon={Receipt} tone="amber" hint={`${data.expenses.length} record(s)`} />
        <KpiCard label="Combined" value={formatINR(totalFuel + totalExpenses)} icon={Wallet} tone="green" hint="Fuel + other expenses" />
      </div>

      <div className="tabs" role="tablist">
        <button className={tab === 'fuel' ? 'on' : ''} onClick={() => setTab('fuel')}>Fuel entries</button>
        <button className={tab === 'expenses' ? 'on' : ''} onClick={() => setTab('expenses')}>Other expenses</button>
      </div>

      <div className="toolbar">
        <select value={vehicleFilter} onChange={(e) => setVehicleFilter(e.target.value)} aria-label="Filter by vehicle">
          <option value="All">All vehicles</option>
          {data.vehicles.map((v) => (
            <option key={v.id} value={v.id}>
              {v.regNo}
            </option>
          ))}
        </select>
      </div>

      {tab === 'fuel' ? (
        <div className="card" style={{ padding: 0 }}>
          {fuelRows.length === 0 ? (
            <div style={{ padding: 20 }}>
              <EmptyState icon={Fuel} title="No fuel entries" text="Add a fill-up to track litres, cost and efficiency." />
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Vehicle</th>
                    <th className="num">Litres</th>
                    <th className="num">Price / litre</th>
                    <th className="num">Odometer</th>
                    <th className="num">Total cost</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fuelRows.map((f) => (
                    <tr key={f.id}>
                      <td>{formatDate(f.date)}</td>
                      <td className="cell-strong">{vehicleById[f.vehicleId]?.regNo || 'Removed vehicle'}</td>
                      <td className="num">{formatNumber(f.litres, 1)}</td>
                      <td className="num">{formatINR(f.pricePerLitre)}</td>
                      <td className="num">{formatNumber(f.odometer)} km</td>
                      <td className="num">{formatINR(f.totalCost)}</td>
                      <td>
                        <div className="actions">
                          <button className="icon-btn danger" onClick={() => setDeleteTarget({ kind: 'fuel', id: f.id, label: `this fuel entry from ${formatDate(f.date)}` })} aria-label="Delete fuel entry">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          {expenseRows.length === 0 ? (
            <div style={{ padding: 20 }}>
              <EmptyState icon={Receipt} title="No expenses recorded" text="Log tolls, parking, allowances, repairs and permits here." />
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none', borderRadius: 14 }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Vehicle</th>
                    <th>Trip</th>
                    <th>Description</th>
                    <th className="num">Amount</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {expenseRows.map((e) => (
                    <tr key={e.id}>
                      <td>{formatDate(e.date)}</td>
                      <td className="cell-strong">{e.category}</td>
                      <td>{vehicleById[e.vehicleId]?.regNo || <span className="muted-text">—</span>}</td>
                      <td>{tripById[e.tripId]?.id || <span className="muted-text">—</span>}</td>
                      <td className="muted">{e.description || '—'}</td>
                      <td className="num">{formatINR(e.amount)}</td>
                      <td>
                        <div className="actions">
                          <button className="icon-btn danger" onClick={() => setDeleteTarget({ kind: 'expense', id: e.id, label: `this ${e.category} expense` })} aria-label="Delete expense">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <Modal
        open={formOpen}
        title={tab === 'fuel' ? 'Add Fuel Entry' : 'Add Expense'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              Save
            </button>
          </>
        }
      >
        <ErrorList errors={errors} />
        {tab === 'fuel' ? (
          <div className="form-grid">
            <Field label="Vehicle" full>
              <select value={fuelForm.vehicleId} onChange={setF('vehicleId')}>
                <option value="">Select a vehicle</option>
                {data.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNo} · {v.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Date">
              <input type="date" value={fuelForm.date} onChange={setF('date')} />
            </Field>
            <Field label="Odometer (km)">
              <input type="number" min="0" value={fuelForm.odometer} onChange={setF('odometer')} />
            </Field>
            <Field label="Litres">
              <input type="number" min="0" step="0.1" value={fuelForm.litres} onChange={setF('litres')} />
            </Field>
            <Field label="Price per litre (₹)">
              <input type="number" min="0" step="0.01" value={fuelForm.pricePerLitre} onChange={setF('pricePerLitre')} />
            </Field>
            <div className="total-box">
              <span>Total cost</span>
              <span>{formatINR(fuelPreview)}</span>
            </div>
          </div>
        ) : (
          <div className="form-grid">
            <Field label="Category">
              <select value={expenseForm.category} onChange={setE('category')}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <Field label="Amount (₹)">
              <input type="number" min="0" value={expenseForm.amount} onChange={setE('amount')} />
            </Field>
            <Field label="Date">
              <input type="date" value={expenseForm.date} onChange={setE('date')} />
            </Field>
            <Field label="Vehicle (optional)">
              <select value={expenseForm.vehicleId} onChange={setE('vehicleId')}>
                <option value="">— None —</option>
                {data.vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.regNo}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Trip (optional)" full>
              <select value={expenseForm.tripId} onChange={setE('tripId')}>
                <option value="">— None —</option>
                {data.trips.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.id} · {t.source} → {t.destination}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Description" full>
              <input value={expenseForm.description} onChange={setE('description')} placeholder="Highway tolls Delhi–Jaipur" />
            </Field>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete record?"
        message={`Delete ${deleteTarget?.label}? This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
