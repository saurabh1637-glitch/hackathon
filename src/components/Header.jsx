import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, Bell, Menu, Moon, Search, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import { NAV_ITEMS, VEHICLE_STATUS as VS, TRIP_STATUS as TS } from '../utils/constants.js';
import { licenseState } from '../utils/rules.js';

const SEARCHABLE = ['/', '/vehicles', '/drivers', '/trips', '/maintenance', '/fuel'];

const buildAlerts = (data) => {
  const list = [];
  data.drivers.forEach((d) => {
    const state = licenseState(d.licenseExpiry, data.settings.licenseWarnDays);
    if (state === 'expired') list.push({ text: `${d.name}'s license has expired`, path: '/drivers' });
    if (state === 'expiring') list.push({ text: `${d.name}'s license expires soon`, path: '/drivers' });
  });
  data.vehicles
    .filter((v) => v.status === VS.IN_SHOP)
    .forEach((v) => list.push({ text: `${v.regNo} is In Shop`, path: '/maintenance' }));
  const drafts = data.trips.filter((t) => t.status === TS.DRAFT).length;
  if (drafts) list.push({ text: `${drafts} draft trip(s) waiting for dispatch`, path: '/trips' });
  return list;
};

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

export default function Header({ onMenu }) {
  const { pathname } = useLocation();
  const { data, updateSettings, searchQuery, setSearchQuery } = useApp();
  const [showAlerts, setShowAlerts] = useState(false);
  const wrapRef = useRef(null);

  const isDark = data.settings.theme === 'dark';
  const profile = data.settings.profile;
  const title = NAV_ITEMS.find((n) => n.path === pathname)?.label || 'TransitOps';
  const alerts = buildAlerts(data);
  const searchable = SEARCHABLE.includes(pathname);

  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowAlerts(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Open menu">
          <Menu size={20} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="topbar-right">
        {searchable && (
          <div className="search">
            <Search size={16} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${title.toLowerCase()}…`}
              aria-label="Search"
            />
          </div>
        )}

        <button
          className="icon-btn"
          onClick={() => updateSettings({ theme: isDark ? 'light' : 'dark' })}
          aria-label="Toggle light and dark mode"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        <div className="notif-wrap" ref={wrapRef}>
          <button className="icon-btn" onClick={() => setShowAlerts((s) => !s)} aria-label="Notifications">
            <Bell size={18} />
            {alerts.length > 0 && <span className="dot" />}
          </button>
          {showAlerts && (
            <div className="dropdown">
              <div className="dropdown-title">Notifications</div>
              {alerts.length === 0 && <div className="dropdown-empty">You're all caught up.</div>}
              {alerts.map((a, i) => (
                <Link key={i} to={a.path} className="dropdown-item" onClick={() => setShowAlerts(false)}>
                  <AlertTriangle size={16} color="#d97706" />
                  <span>{a.text}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="profile-chip">
          <div className="avatar">{initials(profile.name)}</div>
          <div className="profile-text">
            <div style={{ fontWeight: 600 }}>{profile.name}</div>
            <small>{profile.role}</small>
          </div>
        </div>
      </div>
    </header>
  );
}
