import { useState } from 'react';
import { Download, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Modal from '../components/Modal.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Field from '../components/Field.jsx';
import ErrorList from '../components/ErrorList.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { DRIVER_STATUS as DS, LICENSE_CATEGORIES } from '../utils/constants.js';
import { formatDate } from '../utils/format.js';
import { licenseState } from '../utils/rules.js';
import { downloadCSV } from '../utils/csv.js';

const EMPTY = {
  name: '',
  licenseNo: '',
  licenseCategory: 'HMV',
  licenseExpiry: '',
  contact: '',
  safetyScore: '80',
  status: DS.AVAILABLE,
};

const LICENSE_LABEL = { expired: 'Expired', expiring: 'Expiring soon', valid: 'Valid' };

export default function Drivers() {
  const { data, searchQuery, saveDriver, deleteDriver, toast } = useApp();
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const warnDays = data.settings.licenseWarnDays;

  const openNew = () => {
    setEditing(null);
    setForm(EMPTY);
    setErrors([]);
    setFormOpen(true);
  };

  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name,
      licenseNo: d.licenseNo,
      licenseCategory: d.licenseCategory,
      licenseExpiry: d.licenseExpiry,
      contact: d.contact,
      safetyScore: String(d.safetyScore),
      status: d.status === DS.OFF_DUTY || d.status === DS.SUSPENDED ? d.status : DS.AVAILABLE,
    });
    setErrors([]);
    setFormOpen(true);
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const save = () => {
    const res = saveDriver(form, editing?.id);
    if (!res.ok) {
      setErrors(res.errors);
      return;
    }
    toast(editing ? 'Driver updated' : 'Driver added');
    setFormOpen(false);
  };

  const confirmDelete = () => {
    const res = deleteDriver(deleteTarget.id);
    if (res.ok) toast('Driver deleted');
    else toast(res.errors[0], 'error');
    setDeleteTarget(null);
  };

  const q = searchQuery.trim().toLowerCase();
  const rows = data.drivers.filter(
    (d) =>
      (statusFilter === 'All' || d.status === statusFilter) &&
      (categoryFilter === 'All' || d.licenseCategory === categoryFilter) &&
      (!q || [d.name, d.licenseNo, d.contact].some((x) => String(x).toLowerCase().includes(q)))
  );

  const exportCsv = () =>
    downloadCSV(
      'transitops-drivers.csv',
      ['Name', 'License No', 'Category', 'License Expiry', 'Contact', 'Safety Score', 'Status'],
      rows.map((d) => [d.name, d.licenseNo, d.licenseCategory, d.licenseExpiry, d.contact, d.safetyScore, d.status])
    );

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Drivers</h2>
          <p>{data.drivers.length} drivers · licenses expiring within {warnDays} days are flagged</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={exportCsv} disabled={rows.length === 0}>
            <Download size={16} /> Export CSV
          </button>
          <button className="btn btn-primary" onClick={openNew}>
            <Plus size={16} /> Add Driver
          </button>
        </div>
      </div>

      <div className="toolbar">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="All">All statuses</option>
          {Object.values(DS).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label="Filter by license category">
          <option value="All">All license categories</option>
          {LICENSE_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span className="muted-text">Showing {rows.length} of {data.drivers.length}</span>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {rows.length === 0 ? (
          <div style={{ padding: 20 }}>
            <EmptyState
              icon={Users}
              title={data.drivers.length === 0 ? 'No drivers yet' : 'No drivers match your filters'}
              text={data.drivers.length === 0 ? 'Add a driver to assign them to trips.' : 'Try a different search or filter.'}
            />
          </div>
        ) : (
          <div className="table-wrap" style={{ border: 'none', borderRadius: 14 }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>License No.</th>
                  <th>Category</th>
                  <th>License Expiry</th>
                  <th>Contact</th>
                  <th>Safety Score</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((d) => {
                  const state = licenseState(d.licenseExpiry, warnDays);
                  const rowClass = state === 'expired' ? 'row-danger' : state === 'expiring' ? 'row-warn' : '';
                  return (
                    <tr key={d.id} className={rowClass}>
                      <td className="cell-strong">{d.name}</td>
                      <td className="muted">{d.licenseNo}</td>
                      <td>{d.licenseCategory}</td>
                      <td>
                        <div>{formatDate(d.licenseExpiry)}</div>
                        {state !== 'valid' && (
                          <StatusBadge
                            status={state === 'expired' ? 'Expired' : 'Expiring soon'}
                            label={LICENSE_LABEL[state]}
                          />
                        )}
                      </td>
                      <td>{d.contact}</td>
                      <td>
                        <div className="score">
                          <div className="score-track">
                            <div className="score-bar" style={{ width: `${d.safetyScore}%` }} />
                          </div>
                          <strong>{d.safetyScore}</strong>
                        </div>
                      </td>
                      <td>
                        <StatusBadge status={d.status} />
                      </td>
                      <td>
                        <div className="actions">
                          <button className="icon-btn" onClick={() => openEdit(d)} aria-label={`Edit ${d.name}`}>
                            <Pencil size={15} />
                          </button>
                          <button className="icon-btn danger" onClick={() => setDeleteTarget(d)} aria-label={`Delete ${d.name}`}>
                            <Trash2 size={15} />
                          </button>
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

      <Modal
        open={formOpen}
        title={editing ? `Edit ${editing.name}` : 'Add Driver'}
        onClose={() => setFormOpen(false)}
        footer={
          <>
            <button className="btn btn-ghost" onClick={() => setFormOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={save}>
              {editing ? 'Save changes' : 'Add driver'}
            </button>
          </>
        }
      >
        <ErrorList errors={errors} />
        <div className="form-grid">
          <Field label="Full name" full>
            <input value={form.name} onChange={set('name')} placeholder="Rajesh Kumar" />
          </Field>
          <Field label="License number">
            <input value={form.licenseNo} onChange={set('licenseNo')} placeholder="MH1220190012345" />
          </Field>
          <Field label="License category">
            <select value={form.licenseCategory} onChange={set('licenseCategory')}>
              {LICENSE_CATEGORIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="License expiry date">
            <input type="date" value={form.licenseExpiry} onChange={set('licenseExpiry')} />
          </Field>
          <Field label="Contact (10-digit mobile)">
            <input value={form.contact} onChange={set('contact')} placeholder="9876543210" maxLength={12} />
          </Field>
          <Field label="Safety score (0–100)">
            <input type="number" min="0" max="100" value={form.safetyScore} onChange={set('safetyScore')} />
          </Field>
          <Field label="Status" full hint="On Trip is set automatically when the driver is assigned to a dispatched trip.">
            <select value={form.status} onChange={set('status')}>
              <option value={DS.AVAILABLE}>Available</option>
              <option value={DS.OFF_DUTY}>Off Duty</option>
              <option value={DS.SUSPENDED}>Suspended</option>
            </select>
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete driver?"
        message={`${deleteTarget?.name} will be removed. This cannot be undone.`}
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
