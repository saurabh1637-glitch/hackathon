import { useMemo, useState } from 'react';
import { Download, Fuel, Gauge, IndianRupee, Route, Wrench } from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useApp } from '../context/AppContext.jsx';
import KpiCard from '../components/KpiCard.jsx';
import EmptyState from '../components/EmptyState.jsx';
import Field from '../components/Field.jsx';
import { CHART_COLORS, TRIP_STATUS as TS } from '../utils/constants.js';
import { formatINR, formatNumber, todayISO } from '../utils/format.js';
import { downloadCSV } from '../utils/csv.js';
import { filterByDate, fuelEfficiency, sumBy, tripCompletion } from '../utils/analytics.js';

const PIE_COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444'];

export default function Reports() {
  const { data } = useApp();
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');

  const vehicleById = useMemo(() => Object.fromEntries(data.vehicles.map((v) => [v.id, v])), [data.vehicles]);

  const fuelRows = filterByDate(data.fuel, from, to);
  const maintRows = filterByDate(data.maintenance, from, to);
  const expenseRows = filterByDate(data.expenses, from, to);
  const tripRows = filterByDate(data.trips, from, to, 'startTime');

  const fuelCost = sumBy(fuelRows, 'totalCost');
  const maintCost = sumBy(maintRows, 'cost');
  const otherCost = sumBy(expenseRows, 'amount');
  const operatingCost = fuelCost + maintCost + otherCost;

  const efficiency = fuelEfficiency(data.fuel, data.vehicles, from, to);
  const avgKmpl = efficiency.length ? efficiency.reduce((s, r) => s + r.kmpl, 0) / efficiency.length : null;
  const completion = tripCompletion(data.trips, from, to);

  const operational = data.vehicles.filter((v) => v.status !== 'Retired');
  const onTrip = operational.filter((v) => v.status === 'On Trip').length;
  const utilization = operational.length ? Math.round((onTrip / operational.length) * 100) : 0;

  const costBreakdown = [
    { name: 'Fuel', value: fuelCost },
    { name: 'Maintenance', value: maintCost },
    { name: 'Other expenses', value: otherCost },
  ].filter((x) => x.value > 0);

  const maintByVehicle = data.vehicles
    .map((v) => ({
      name: v.regNo,
      cost: sumBy(maintRows.filter((m) => m.vehicleId === v.id), 'cost'),
    }))
    .filter((x) => x.cost > 0);

  const tripStatusData = Object.values(TS)
    .map((s) => ({ name: s, value: tripRows.filter((t) => t.status === s).length }))
    .filter((x) => x.value > 0);

  const clearDates = () => {
    setFrom('');
    setTo('');
  };

  const exportFuel = () =>
    downloadCSV(
      `transitops-fuel-${todayISO()}.csv`,
      ['Date', 'Vehicle', 'Litres', 'Price per Litre (INR)', 'Odometer (km)', 'Total Cost (INR)'],
      fuelRows.map((f) => [f.date, vehicleById[f.vehicleId]?.regNo || '', f.litres, f.pricePerLitre, f.odometer, f.totalCost])
    );

  const exportMaintenance = () =>
    downloadCSV(
      `transitops-maintenance-${todayISO()}.csv`,
      ['Record', 'Vehicle', 'Issue', 'Date', 'Cost (INR)', 'Notes', 'Status'],
      maintRows.map((m) => [m.id, vehicleById[m.vehicleId]?.regNo || '', m.issue, m.date, m.cost, m.notes, m.status])
    );

  const exportExpenses = () =>
    downloadCSV(
      `transitops-expenses-${todayISO()}.csv`,
      ['Date', 'Category', 'Vehicle', 'Trip', 'Amount (INR)', 'Description'],
      expenseRows.map((e) => [e.date, e.category, vehicleById[e.vehicleId]?.regNo || '', e.tripId || '', e.amount, e.description])
    );

  const exportTrips = () =>
    downloadCSV(
      `transitops-trips-${todayISO()}.csv`,
      ['Trip ID', 'Source', 'Destination', 'Vehicle', 'Driver ID', 'Cargo (kg)', 'Distance (km)', 'Start', 'Status'],
      tripRows.map((t) => [t.id, t.source, t.destination, vehicleById[t.vehicleId]?.regNo || '', t.driverId || '', t.cargoKg, t.distanceKm, t.startTime, t.status])
    );

  const exportVehicles = () =>
    downloadCSV(
      `transitops-vehicles-${todayISO()}.csv`,
      ['Registration', 'Name/Model', 'Type', 'Max Load (kg)', 'Odometer (km)', 'Acquisition Cost (INR)', 'Status'],
      data.vehicles.map((v) => [v.regNo, v.name, v.type, v.capacityKg, v.odometer, v.acquisitionCost, v.status])
    );

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Reports</h2>
          <p>Summaries and exports for the selected date range. Leave dates empty to include all records.</p>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={clearDates}>
            Clear dates
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="filter-row" style={{ marginBottom: 0 }}>
          <Field label="From">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </Field>
          <Field label="To">
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </Field>
          <div className="muted-text" style={{ alignSelf: 'center' }}>
            Fuel, maintenance and expense totals use their own dates. Trips use start date.
          </div>
        </div>
      </div>

      <div className="grid-kpi">
        <KpiCard label="Avg. fuel efficiency" value={avgKmpl ? `${formatNumber(avgKmpl, 2)} km/L` : '—'} icon={Gauge} tone="blue" hint="From odometer readings" />
        <KpiCard label="Fleet utilization" value={`${utilization}%`} icon={Route} tone="green" hint="Current snapshot, not date-filtered" />
        <KpiCard label="Operating cost" value={formatINR(operatingCost)} icon={IndianRupee} tone="amber" hint="Fuel + maintenance + expenses" />
        <KpiCard label="Trip completion" value={`${completion.rate}%`} icon={Route} tone="green" hint={`${completion.completed} of ${completion.started} started trips`} />
        <KpiCard label="Fuel cost" value={formatINR(fuelCost)} icon={Fuel} tone="blue" />
        <KpiCard label="Maintenance cost" value={formatINR(maintCost)} icon={Wrench} tone="amber" />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Fuel efficiency by vehicle</h3>
              <small>Km per litre, from first to last reading in range (needs 2+ fill-ups)</small>
            </div>
          </div>
          {efficiency.length === 0 ? (
            <EmptyState title="Not enough data" text="Add at least two fuel entries for a vehicle to see efficiency." />
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={efficiency.map((r) => ({ name: r.regNo, kmpl: Number(r.kmpl.toFixed(2)) }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="kmpl" name="km/L" fill="#2563eb" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Operating cost breakdown</h3>
              <small>Fuel, maintenance and other expenses in range</small>
            </div>
          </div>
          {costBreakdown.length === 0 ? (
            <EmptyState title="No costs in this range" text="Record fuel, maintenance or expenses to see the breakdown." />
          ) : (
            <>
              <div className="chart-box-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={costBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {costBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => formatINR(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend-row">
                {costBreakdown.map((c, i) => (
                  <span key={c.name}>
                    <i style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    {c.name}: {formatINR(c.value)}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>Maintenance cost by vehicle</h3>
              <small>Total maintenance spend per vehicle in range</small>
            </div>
          </div>
          {maintByVehicle.length === 0 ? (
            <EmptyState title="No maintenance in range" text="Maintenance costs will appear here once logged." />
          ) : (
            <div className="chart-box">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={maintByVehicle}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" opacity={0.4} />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip formatter={(v) => formatINR(v)} />
                  <Bar dataKey="cost" name="Cost" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-head">
            <div>
              <h3>Trip status in range</h3>
              <small>Completion rate = completed ÷ (dispatched + completed + cancelled)</small>
            </div>
          </div>
          {tripStatusData.length === 0 ? (
            <EmptyState title="No trips in range" text="Trips with a start date in this range will appear here." />
          ) : (
            <>
              <div className="chart-box-sm">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={tripStatusData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={3}>
                      {tripStatusData.map((d, i) => (
                        <Cell key={d.name} fill={['#94a3b8', '#2563eb', '#10b981', '#ef4444'][Object.values(TS).indexOf(d.name)] || PIE_COLORS[i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="legend-row">
                {tripStatusData.map((d) => (
                  <span key={d.name}>
                    <i style={{ background: CHART_COLORS[d.name] || '#64748b' }} />
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
            <h3>Export CSV</h3>
            <small>Files are created in your browser. Excel opens them directly.</small>
          </div>
        </div>
        <div className="head-actions">
          <button className="btn btn-ghost" onClick={exportVehicles}><Download size={16} /> Vehicles</button>
          <button className="btn btn-ghost" onClick={exportTrips}><Download size={16} /> Trips</button>
          <button className="btn btn-ghost" onClick={exportFuel}><Download size={16} /> Fuel entries</button>
          <button className="btn btn-ghost" onClick={exportMaintenance}><Download size={16} /> Maintenance</button>
          <button className="btn btn-ghost" onClick={exportExpenses}><Download size={16} /> Expenses</button>
        </div>
        <p className="muted-text" style={{ marginTop: 14, fontSize: 12 }}>
          ROI is not calculated because the app has no revenue data. Operating cost and efficiency figures are estimates based only on the records you entered.
        </p>
      </div>
    </>
  );
}
