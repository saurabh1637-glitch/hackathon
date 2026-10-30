import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, CheckCircle2, Clock, Gauge, Route, Truck, Users, Wrench } from 'lucide-react';
import { Cell, CartesianGrid, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import KpiCard from '../components/KpiCard.jsx';
import StatusBadge from '../components/StatusBadge.jsx';
import EmptyState from '../components/EmptyState.jsx';
import {
  VEHICLE_STATUS as VS,
  DRIVER_STATUS as DS,
  TRIP_STATUS as TS,
  VEHICLE_TYPES,
  CHART_COLORS,
} from '../utils/constants.js';
import { formatDateTime } from '../utils/format.js';
import { DEMO_TREND } from '../utils/demoData.js';

export default function Dashboard() {
  const { data, searchQuery } = useApp();
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const { vehicles, drivers, trips } = data;

  const retired = vehicles.filter((v) => v.status === VS.RETIRED).length;
  const onTrip = vehicles.filter((v) => v.status === VS.ON_TRIP).length;
  const available = vehicles.filter((v) => v.status === VS.AVAILABLE).length;
  const inShop = vehicles.filter((v) => v.status === VS.IN_SHOP).length;
  const activeTrips = trips.filter((t) => t.status === TS.DISPATCHED).length;
  const pendingTrips = trips.filter((t) => t.status === TS.DRAFT).length;
  const driversOnDuty = drivers.filter((d) => d.status === DS.AVAILABLE || d.status === DS.ON_TRIP).length;
  const operational = vehicles.length - retired;
  const utilization = operational > 0 ? Math.round((onTrip / operational) * 100) : 0;

  const vehicleById = useMemo(() => Object.fromEntries(vehicles.map((v) => [v.id, v])), [vehicles]);
  const driverById = useMemo(() => Object.fromEntries(drivers.map((d) => [d.id, d])), [drivers]);

  const filteredVehicles = vehicles.filter(
    (v) =>
      (typeFilter === 'All' || v.type === typeFilter) &&
      (statusFilter === 'All' || v.status === statusFilter)
  );

  const distribution = Object.values(VS)
    .map((status) => ({ name: status, value: filteredVehicles.filter((v) => v.status === status).length }))
    .filter((d) => d.value > 0);

  const q = searchQuery.trim().toLowerCase();
  const recentTrips = [...trips]
    .sort((a, b) => (b.startTime || '').localeCompare(a.startTime || ''))
    .filter((t) => {
      const v = vehicleById[t.vehicleId];
      if (typeFilter !== 'All' && v?.type !== typeFilter) return false;
      if (statusFilter !== 'All' && v?.status !== statusFilter) return false;
      if (!q) return true;
      return [t.id, t.source, t.destination, v?.regNo].some((x) => String(x || '').toLowerCase().includes(q));
    })
    .slice(0, 8);

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Fleet overview</h2>
          <p>Live counts from your saved records. Charts and filters update as you change data.</p>
        </div>
      </div>

      <div className="grid-kpi">
        <KpiCard label="Total Vehicles" value={vehicles.length} icon={Truck} tone="blue" />
        <KpiCard label="Available Vehicles" value={available} icon={CheckCircle2} tone="green" />
        <KpiCard label="Vehicles On Trip" value={onTrip} icon={Route} tone="blue" />
        <KpiCard label="Vehicles In Maintenance" value={inShop} icon={Wrench} tone="amber" />
        <KpiCard label="Active Trips" value={activeTrips} icon={Activity} tone="blue" />
        <KpiCard label="Pending Trips" value={pendingTrips} icon={Clock} tone="amber" hint="Draft trips" />
        <KpiCard label="Drivers On Duty" value={driversOnDuty} icon={Users} tone="green" hint="Available + On Trip" />
        <KpiCard label="Fleet Utilization" value={`${utilization}%`} icon={Gauge} tone="blue" hint="On Trip ÷ operational vehicles" />
      </div>

      <div className="toolbar">
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} aria-label="Filter by vehicle type">
          <option value="All">All vehicle types</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by vehicle status">
          <option value="All">All vehicle statuses</option>
          {Object.values(VS).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <span className="muted-text">Filters apply to the status chart and recent trips.</span>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Fleet utilization trend</h3>
              <small>Demo trend data (sample values, not calculated)</small>
            </div>
          </div>
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={DEMO_TREND} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} unit="%" domain={[0, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="utilization" name="Utilization" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Vehicle status distribution</h3>
              <small>{filteredVehicles.length} vehicle(s) in view</small>
            </div>
          </div>
          {distribution.length === 0 ? (
            <EmptyState title="No vehicles match" text="Change the filters above to see the chart." />
          ) : (
            <>
              <div className="chart-box-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {distribution.map((d) => (
                        <Cell key={d.name} fill={CHART_COLORS[d.name]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend-row">
                {distribution.map((d) => (
                  <span key={d.name}>
                    <i style={{ background: CHART_COLORS[d.name] }} />
                    {d.name}: {d.value}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-head">
          <div>
            <h3>Recent trips</h3>
            <small>Latest 8 trips, newest first</small>
          </div>
          <Link to="/trips" className="btn btn-ghost btn-sm">
            View all trips
          </Link>
        </div>
        {recentTrips.length === 0 ? (
          <EmptyState icon={Route} title="No trips found" text="Create a trip on the Trips page, or clear the filters." />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Trip ID</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Start</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentTrips.map((t) => (
                  <tr key={t.id}>
                    <td className="cell-strong">{t.id}</td>
                    <td>
                      {t.source} → {t.destination}
                    </td>
                    <td>{vehicleById[t.vehicleId]?.regNo || <span className="muted-text">Unassigned</span>}</td>
                    <td>{driverById[t.driverId]?.name || <span className="muted-text">Unassigned</span>}</td>
                    <td className="muted">{formatDateTime(t.startTime)}</td>
                    <td>
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
