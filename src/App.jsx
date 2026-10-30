import { useEffect, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import Toasts from './components/Toasts.jsx';
import EmptyState from './components/EmptyState.jsx';
import { useApp } from './context/AppContext.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Vehicles from './pages/Vehicles.jsx';
import Drivers from './pages/Drivers.jsx';
import Trips from './pages/Trips.jsx';
import Maintenance from './pages/Maintenance.jsx';
import FuelExpenses from './pages/FuelExpenses.jsx';
import Reports from './pages/Reports.jsx';
import Settings from './pages/Settings.jsx';
import { Compass } from 'lucide-react';

export default function App() {
  const [navOpen, setNavOpen] = useState(false);
  const { pathname } = useLocation();
  const { setSearchQuery } = useApp();

  useEffect(() => {
    setNavOpen(false);
    setSearchQuery('');
  }, [pathname, setSearchQuery]);

  return (
    <div className="app-shell">
      <div className={`scrim ${navOpen ? 'show' : ''}`} onClick={() => setNavOpen(false)} />
      <Sidebar open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="main">
        <Header onMenu={() => setNavOpen(true)} />
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/vehicles" element={<Vehicles />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/trips" element={<Trips />} />
            <Route path="/maintenance" element={<Maintenance />} />
            <Route path="/fuel" element={<FuelExpenses />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route
              path="*"
              element={<EmptyState icon={Compass} title="Page not found" text="Use the sidebar to open a TransitOps page." />}
            />
          </Routes>
        </main>
      </div>
      <Toasts />
    </div>
  );
}
