import { useMemo, useState } from 'react';
import { Ban, CheckCircle2, Eye, Pencil, Plus, Route, Send } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Field from '../components/Field.jsx';
import ErrorList from '../components/ErrorList.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { TRIP_STATUS as TS, VEHICLE_STATUS as VS, DRIVER_STATUS as DS } from '../utils/constants.js';
import { formatDateTime, formatNumber, nowLocalInput } from '../utils/format.js';

const blankForm = () => ({
  source: '',
  destination: '',
  vehicleId: '',
  driverId: '',
  cargoKg: '',
  distanceKm: '',
  startTime: nowLocalInput(),
});

const ACTION_LABEL = { dispatch: 'dispatched', complete: 'completed', cancel: 'cancelled' };

export default function Trips() {
  const { data, searchQuery, saveTrip, dispatchTrip, completeTrip, cancelTrip, toast } = useApp();
  const [statusFilter, setStatusFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [errors, setErrors] = useState([]);
  const [viewing, setViewing] = useState(null);
  const [pending, setPending] = useState(null); // { action, trip }
  const [blocked, setBlocked] = useState(null); // { title, errors }

  const vehicleById = useMemo(() => Object.fromEntries(data.vehicles.map((v) => [v.id, v])), [data.vehicles]);
  const driverById = useMemo(() => Object.fromEntries(data.drivers.map((d) => [d.id, d])), [data.drivers]);

  const openNew = () => {
    setEditing(null);
    setForm(blankForm());
    setErrors([]);
    setFormOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({
      source: t.source,
      destination: t.destination,
      vehicleId: t.vehicleId || '',
      driverId: t.driverId || '',
      cargoKg: String(t.cargoKg),
      distanceKm: String(t.distanceKm),
      startTime: t.startTime,
    });
    setErrors([]);
    setFormOpen(true);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = () => {
    const res = saveTrip(form, editing?.id);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    toast(editing ? `Trip ${editing.id} updated` : 'Draft trip created');
    setFormOpen(false);
  };

  const runAction = () => {
    const { action, trip } = pending;
    const fn = action === 'dispatch' ? dispatchTrip : action === 'complete' ? completeTrip : cancelTrip;
    const res = fn(trip.id);
    setPending(null);
    if (!res.ok) {
      setBlocked({ title: `Cannot ${action} ${trip.id}`, errors: res.errors });
      return;
    }
    toast(`Trip ${trip.id} ${ACTION_LABEL[action]}`);
  };

  const q = searchQuery.trim().toLowerCase();
  const rows = [...data.trips]
    .sort((a, b) => (b.startTime || '').localeCompare(a.startTime || ''))
    .filter((t) => {
      const v = vehicleById[t.vehicleId];
      const d = driverById[t.driverId];
      if (statusFilter !== 'All' && t.status !== statusFilter) return false;
      if (!q) return true;
      return [t.id, t.source, t.destination, v?.regNo, d?.name].some((x) => String(x || '').toLowerCase().includes(q));
    });

  const activeVehicles = data.vehicles.filter((v) => v.status !== VS.RETIRED);
  const activeDrivers = data.drivers.filter((d) => d.status !== DS.SUSPENDED);

  const pendingLabel = pending ? ACTION_LABEL[pending.action] : '';

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Trips</h2>
          <p>Lifecycle: Draft → Dispatched → Completed, or Cancelled at any open stage</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> Create Trip
          </button>
        </div>
      </div>

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by trip status">
          <option value="All">All statuses</option>
          {Object.values(TS).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="muted-text">Showing {rows.length} of {data.trips.length}</span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState
              icon={Route}
              title={data.trips.length === 0 ? 'No trips yet' : 'No trips match your filters'}
              text={data.trips.length === 0 ? 'Create a trip to plan your first delivery.' : 'Try a different search or status.'}
            />
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Source → Destination</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th className="num">Cargo</th>
                  <th className="num">Distance</th>
                  <th>Start</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((t) => {
                  const v = vehicleById[t.vehicleId];
                  const d = driverById[t.driverId];
                  const canEdit = t.status === TS.DRAFT;
                  const canDispatch = t.status === TS.DRAFT;
                  const canComplete = t.status === TS.DISPATCHED;
                  const canCancel = t.status === TS.DRAFT || t.status === TS.DISPATCHED;
                  return (
                    <tr key={t.id}>
                      <td className="cell-strong">{t.id}</td>
                      <td>
                        {t.source} → {t.destination}
                      </td>
                      <td>{v ? v.regNo : <span className="muted-text">Unassigned</span>}</td>
                      <td>{d ? d.name : <span className="muted-text">Unassigned</span>}</td>
                      <td className="num">{formatNumber(t.cargoKg)} kg</td>
                      <td className="num">{formatNumber(t.distanceKm)} km</td>
                      <td className="muted">{formatDateTime(t.startTime)}</td>
                      <td>
                        <StatusBadge status={t.status} />
                      </td>
                      <td>
                        <div className="actions">
                          <button className="icon-btn" onClick={() => setViewing(t)} aria-label={`View ${t.id}`} title="View details">
                            <Eye size={15} />
                          </button>
                          {canEdit && (
                            <button className="icon-btn" onClick={() => openEdit(t)} aria-label={`Edit ${t.id}`} title="Edit">
                              <Pencil size={15} />
                            </button>
                          )}
                          {canDispatch && (
                            <button className="icon-btn" onClick={() => setPending({ action: 'dispatch', trip: t })} aria-label={`Dispatch ${t.id}`} title="Dispatch">
                              <Send size={15} />
                            </button>
                          )}
                          {canComplete && (
                            <button className="icon-btn" onClick={() => setPending({ action: 'complete', trip: t })} aria-label={`Complete ${t.id}`} title="Mark completed">
                              <CheckCircle2 size={15} />
                            </button>
                          )}
                          {canCancel && (
                            <button className="icon-btn danger" onClick={() => setPending({ action: 'cancel', trip: t })} aria-label={`Cancel ${t.id}`} title="Cancel trip">
                              <Ban size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / edit form */}
      <Modal
        open={formOpen}
        wide
        title={editing ? `Edit ${editing.id}` : 'Create Trip'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              {editing ? 'Save changes' : 'Create draft'}
            </button>
          </>
        }
      >
        <ErrorList errors={errors} />
        <div className="info-box">New trips start as Draft. Dispatch them from the Trips table once the checks pass.</div>
        <div className="form-grid">
          <Field label="Source">
            <input value={form.source} onChange={set('source')} placeholder="Mumbai" />
          </Field>
          <Field label="Destination">
            <input value={form.destination} onChange={set('destination')} placeholder="Pune" />
          </Field>
          <Field label="Assigned vehicle">
            <select value={form.vehicleId} onChange={set('vehicleId')}>
              <option value="">— Not assigned —</option>
              {activeVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.regNo} · {v.name} · {formatNumber(v.capacityKg)} kg · {v.status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Assigned driver">
            <select value={form.driverId} onChange={set('driverId')}>
              <option value="">— Not assigned —</option>
              {activeDrivers.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} · {d.licenseCategory} · {d.status}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Cargo weight (kg)">
            <input type="number" min="0" value={form.cargoKg} onChange={set('cargoKg')} />
          </Field>
          <Field label="Planned distance (km)">
            <input type="number" min="0" value={form.distanceKm} onChange={set('distanceKm')} />
          </Field>
          <Field label="Start time" full>
            <input type="datetime-local" value={form.startTime} onChange={set('startTime')} />
          </Field>
        </div>
      </Modal>

      {/* Details */}
      <Modal open={!!viewing} title={viewing ? `Trip ${viewing.id}` : ''} onClose={() => setViewing(null)} wide>
        {viewing && (
          <dl className="detail-grid">
            <div>
              <dt>Route</dt>
              <dd>
                {viewing.source} → {viewing.destination}
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <StatusBadge status={viewing.status} />
              </dd>
            </div>
            <div>
              <dt>Vehicle</dt>
              <dd>
                {vehicleById[viewing.vehicleId]
                  ? `${vehicleById[viewing.vehicleId].regNo} (${vehicleById[viewing.vehicleId].name})`
                  : 'Unassigned'}
              </dd>
            </div>
            <div>
              <dt>Driver</dt>
              <dd>{driverById[viewing.driverId]?.name || 'Unassigned'}</dd>
            </div>
            <div>
              <dt>Cargo weight</dt>
              <dd>{formatNumber(viewing.cargoKg)} kg</dd>
            </div>
            <div>
              <dt>Planned distance</dt>
              <dd>{formatNumber(viewing.distanceKm)} km</dd>
            </div>
            <div>
              <dt>Start time</dt>
              <dd>{formatDateTime(viewing.startTime)}</dd>
            </div>
          </dl>
        )}
      </Modal>

      {/* Confirm lifecycle actions */}
      <ConfirmDialog
        open={!!pending}
        title={pending ? `${pending.action === 'dispatch' ? 'Dispatch' : pending.action === 'complete' ? 'Complete' : 'Cancel'} trip ${pending.trip.id}?` : ''}
        message={
          pending?.action === 'dispatch'
            ? 'The assigned vehicle and driver will be marked On Trip. Dispatch is blocked if any check fails.'
            : pending?.action === 'complete'
            ? 'The vehicle and driver will return to Available, and the vehicle odometer will increase by the trip distance.'
            : 'The trip will be cancelled. Its vehicle and driver return to Available if they have no other active work.'
        }
        confirmLabel={pendingLabel ? pendingLabel.charAt(0).toUpperCase() + pendingLabel.slice(1) : 'Confirm'}
        danger={pending?.action === 'cancel'}
        onConfirm={runAction}
        onCancel={() => setPending(null)}
      />

      {/* Clear explanation when dispatch or another action is blocked */}
      <Modal open={!!blocked} title={blocked?.title || ''} onClose={() => setBlocked(null)} footer={<button className="btn btn-primary" onClick={() => setBlocked(null)}>Got it</button>}>
        <ErrorList errors={blocked?.errors} title="This action was blocked for these reasons:" />
        <p className="muted-text">Fix the issues above (for example, by editing the trip or updating the vehicle or driver), then try again.</p>
      </Modal>
    </>
  );
}
