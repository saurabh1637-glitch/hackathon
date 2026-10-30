import { useState } from 'react';
import { Download, Pencil, Plus, Trash2, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Field from '../components/Field.jsx';
import ErrorList from '../components/ErrorList.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { VEHICLE_STATUS as VS, VEHICLE_TYPES } from '../utils/constants.js';
import { formatINR, formatNumber } from '../utils/format.js';
import { downloadCSV } from '../utils/csv.js';

const EMPTY = {
  regNo: '',
  name: '',
  type: 'Truck',
  capacityKg: '',
  odometer: '',
  acquisitionCost: '',
  status: VS.AVAILABLE,
};

export default function Vehicles() {
  const { data, searchQuery, saveVehicle, deleteVehicle, toast } = useApp();
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors([]);
    setFormOpen(true);
  };

  const openEdit = (v) => {
    setEditing(v);
    setForm({
      regNo: v.regNo,
      name: v.name,
      type: v.type,
      capacityKg: String(v.capacityKg),
      odometer: String(v.odometer),
      acquisitionCost: String(v.acquisitionCost),
      status: v.status === VS.RETIRED ? VS.RETIRED : VS.AVAILABLE,
    });
    setErrors([]);
    setFormOpen(true);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = () => {
    const res = saveVehicle(form, editing?.id);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    toast(editing ? 'Vehicle updated' : 'Vehicle added');
    setFormOpen(false);
  };

  const confirmDelete = () => {
    const res = deleteVehicle(deleteTarget.id);
    if (res.ok) toast('Vehicle deleted');
    else toast(res.errors[0], 'error');
    setDeleteTarget(null);
  };

  const q = searchQuery.trim().toLowerCase();
  const rows = data.vehicles.filter(
    (v) =>
      (typeFilter === 'All' || v.type === typeFilter) &&
      (statusFilter === 'All' || v.status === statusFilter) &&
      (!q || [v.regNo, v.name, v.type].some((x) => x.toLowerCase().includes(q)))
  );

  const exportCsv = () =>
    downloadCSV(
      'transitops-vehicles.csv',
      ['Registration', 'Name/Model', 'Type', 'Max Load (kg)', 'Odometer (km)', 'Acquisition Cost (INR)', 'Status'],
      rows.map((v) => [v.regNo, v.name, v.type, v.capacityKg, v.odometer, v.acquisitionCost, v.status])
    );

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Vehicles</h2>
          <p>{data.vehicles.length} vehicles in the fleet</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={exportCsv} disabled={rows.length === 0}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> Add Vehicle
          </button>
        </div>
      </div>

      <div className="toolbar">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by type">
          <option value="All">All types</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="All">All statuses</option>
          {Object.values(VS).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="muted-text">Showing {rows.length} of {data.vehicles.length}</span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState
              icon={Truck}
              title={data.vehicles.length === 0 ? 'No vehicles yet' : 'No vehicles match your filters'}
              text={data.vehicles.length === 0 ? 'Add your first vehicle to start planning trips.' : 'Try a different search or filter.'}
              action={
                data.vehicles.length === 0 && (
                  <button className="btn btn-primary" onClick={openNew}>
                    <Plus size={16} /> Add Vehicle
                  </button>
                )
              }
            />
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Registration</th>
                  <th>Name / Model</th>
                  <th>Type</th>
                  <th className="num">Max Load</th>
                  <th className="num">Odometer</th>
                  <th className="num">Acquisition Cost</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((v) => (
                  <tr key={v.id}>
                    <td className="cell-strong">{v.regNo}</td>
                    <td>{v.name}</td>
                    <td>{v.type}</td>
                    <td className="num">{formatNumber(v.capacityKg)} kg</td>
                    <td className="num">{formatNumber(v.odometer)} km</td>
                    <td className="num">{formatINR(v.acquisitionCost)}</td>
                    <td>
                      <StatusBadge status={v.status} />
                    </td>
                    <td>
                      <div className="actions">
                        <button className="icon-btn" onClick={() => openEdit(v)} aria-label={`Edit ${v.regNo}`}>
                          <Pencil size={15} />
                        </button>
                        <button className="icon-btn danger" onClick={() => setDeleteTarget(v)} aria-label={`Delete ${v.regNo}`}>
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

      <Modal
        open={formOpen}
        title={editing ? `Edit ${editing.regNo}` : 'Add Vehicle'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              {editing ? 'Save changes' : 'Add vehicle'}
            </button>
          </>
        }
      >
        <ErrorList errors={errors} />
        <div className="form-grid">
          <Field label="Registration number">
            <input value={form.regNo} onChange={set('regNo')} placeholder="MH12AB1234" />
          </Field>
          <Field label="Name / Model">
            <input value={form.name} onChange={set('name')} placeholder="Tata Ultra 1918" />
          </Field>
          <Field label="Vehicle type">
            <select value={form.type} onChange={set('type')}>
              {VEHICLE_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Maximum load capacity (kg)">
            <input type="number" min="0" value={form.capacityKg} onChange={set('capacityKg')} />
          </Field>
          <Field label="Odometer (km)">
            <input type="number" min="0" value={form.odometer} onChange={set('odometer')} />
          </Field>
          <Field label="Acquisition cost (₹)">
            <input type="number" min="0" value={form.acquisitionCost} onChange={set('acquisitionCost')} />
          </Field>
          <Field
            label="Status"
            full
            hint={
              editing && editing.status !== VS.AVAILABLE && editing.status !== VS.RETIRED
                ? `Currently ${editing.status}. On Trip and In Shop are set automatically by trips and maintenance.`
                : 'On Trip and In Shop are set automatically by trips and maintenance.'
            }
          >
            <select value={form.status} onChange={set('status')}>
              <option value={VS.AVAILABLE}>Available</option>
              <option value={VS.RETIRED}>Retired</option>
            </select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete vehicle?"
        message={`${deleteTarget?.regNo} (${deleteTarget?.name}) will be removed from the fleet. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
