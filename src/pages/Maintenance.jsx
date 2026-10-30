import { useMemo, useState } from 'react';
import { CheckCircle2, Plus, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Field from '../components/Field.jsx';
import ErrorList from '../components/ErrorList.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { MAINT_STATUS as MS, VEHICLE_STATUS as VS } from '../utils/constants.js';
import { formatDate, formatINR, todayISO } from '../utils/format.js';

const blankForm = () => ({ vehicleId: '', issue: '', date: todayISO(), cost: '', notes: '' });

export default function Maintenance() {
  const { data, searchQuery, saveMaintenance, closeMaintenance, toast } = useApp();
  const [statusFilter, setStatusFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState([]);
  const [closing, setClosing] = useState(null);

  const vehicleById = useMemo(() => Object.fromEntries(data.vehicles.map((v) => [v.id, v])), [data.vehicles]);
  const selectableVehicles = data.vehicles.filter((v) => v.status !== VS.RETIRED);

  const openNew = () => {
    setForm(blankForm());
    setErrors([]);
    setFormOpen(true);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = () => {
    const res = saveMaintenance(form);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    toast('Maintenance record added. Vehicle is now In Shop.');
    setFormOpen(false);
  };

  const confirmClose = () => {
    closeMaintenance(closing.id);
    toast('Maintenance closed. Vehicle returned to service if no other work is open.');
    setClosing(null);
  };

  const q = searchQuery.trim().toLowerCase();
  const rows = [...data.maintenance]
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''))
    .filter((m) => {
      const v = vehicleById[m.vehicleId];
      if (statusFilter !== 'All' && m.status !== statusFilter) return false;
      if (!q) return true;
      return [m.id, m.issue, v?.regNo, m.notes].some((x) => String(x || '').toLowerCase().includes(q));
    });

  const openCost = data.maintenance.filter((m) => m.status === MS.OPEN).length;

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Maintenance</h2>
          <p>{openCost} open record(s). Open maintenance marks the vehicle In Shop and blocks dispatch.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> Add Maintenance
          </button>
        </div>
      </div>

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by maintenance status">
          <option value="All">All statuses</option>
          {Object.values(MS).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="muted-text">Showing {rows.length} of {data.maintenance.length}</span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState
              icon={Wrench}
              title={data.maintenance.length === 0 ? 'No maintenance records' : 'No records match your filters'}
              text={data.maintenance.length === 0 ? 'Log a service or repair to take a vehicle off the road.' : 'Try a different search or status.'}
            />
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Record</th>
                  <th>Vehicle</th>
                  <th>Issue</th>
                  <th>Date</th>
                  <th className="num">Cost</th>
                  <th>Notes</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((m) => (
                  <tr key={m.id}>
                    <td className="cell-strong">{m.id}</td>
                    <td>{vehicleById[m.vehicleId]?.regNo || <span className="muted-text">Removed vehicle</span>}</td>
                    <td>{m.issue}</td>
                    <td className="muted">{formatDate(m.date)}</td>
                    <td className="num">{formatINR(m.cost)}</td>
                    <td className="muted" style={{ maxWidth: 260 }}>{m.notes || '—'}</td>
                    <td>
                      <StatusBadge status={m.status} />
                    </td>
                    <td>
                      <div className="actions">
                        {m.status === MS.OPEN && (
                          <button className="btn btn-ghost btn-sm" onClick={() => setClosing(m)}>
                            <CheckCircle2 size={14} /> Close
                          </button>
                        )}
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
        title="Add Maintenance Record"
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              Save record
            </button>
          </>
        }
      >
        <ErrorList errors={errors} />
        <div className="info-box">Saving an open record moves the vehicle to In Shop until you close it.</div>
        <div className="form-grid">
          <Field label="Vehicle" full>
            <select value={form.vehicleId} onChange={set('vehicleId')}>
              <option value="">Select a vehicle</option>
              {selectableVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.regNo} · {v.name} · {v.status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Issue / service" full>
            <input value={form.issue} onChange={set('issue')} placeholder="Clutch plate replacement" />
          </Field>
          <Field label="Date">
            <input type="date" value={form.date} onChange={set('date')} />
          </Field>
          <Field label="Cost (₹)">
            <input type="number" min="0" value={form.cost} onChange={set('cost')} />
          </Field>
          <Field label="Notes" full>
            <textarea value={form.notes} onChange={set('notes')} placeholder="Parts, vendor, next steps…" />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!closing}
        title="Close maintenance?"
        message={`${closing?.id} for ${vehicleById[closing?.vehicleId]?.regNo || 'this vehicle'} will be marked Closed. The vehicle returns to Available unless it has other open work or is retired.`}
        confirmLabel="Close maintenance"
        onConfirm={confirmClose}
        onCancel={() => setClosing(null)}
      />
    </>
  );
}
