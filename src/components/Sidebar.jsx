import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, Users, Route, Wrench, Fuel, BarChart3, Settings, X } from 'lucide-react';
import { NAV_ITEMS } from '../utils/constants.js';

const ICONS = {
  '/': LayoutDashboard,
  '/vehicles': Truck,
  '/drivers': Users,
  '/trips': Route,
  '/maintenance': Wrench,
  '/fuel': Fuel,
  '/reports': BarChart3,
  '/settings': Settings,
};

export default function Sidebar({ open, onClose }) {
  return (
    <aside className={`sidebar ${open ? 'open' : ''}`}>
      <div className="brand">
        <div className="brand-mark">
          <Truck size={20} />
        </div>
        <div>
          <div className="brand-name">TransitOps</div>
          <div className="brand-sub">Smart Transport Operations</div>
        </div>
        <button className="icon-btn sidebar-close" onClick={onClose} aria-label="Close menu">
          <X size={18} />
        </button>
      </div>

      <nav className="nav">
        {NAV_ITEMS.map((item) => {
          const Icon = ICONS[item.path];
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-foot">Demo data saved in this browser</div>
    </aside>
  );
}
