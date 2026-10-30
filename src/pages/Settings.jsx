import { useState } from 'react';
import { Moon, RotateCcw, Save, Sun, UserRound } from 'lucide-react';
import { useApp } from '../context/AppContext.jsx';
import Field from '../components/Field.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import ErrorList from '../components/ErrorList.jsx';

const PHONE_RE = /^[6-9]\d{9}$/;

export default function Settings() {
  const { data, updateProfile, updateSettings, resetDemo, toast } = useApp();
  const [profile, setProfile] = useState(data.settings.profile);
  const [companyName, setCompanyName] = useState(data.settings.companyName);
  const [warnDays, setWarnDays] = useState(String(data.settings.licenseWarnDays));
  const [errors, setErrors] = useState([]);
  const [confirmReset, setConfirmReset] = useState(false);

  const isDark = data.settings.theme === 'dark';

  const setP = (key) => (e) => setProfile({ ...profile, [key]: e.target.value });

  const saveProfile = () => {
    const problems = [];
    if (!profile.name.trim()) problems.push('Name is required.');
    if (!/^\S+@\S+\.\S+$/.test(profile.email)) problems.push('Enter a valid email address.');
    if (!PHONE_RE.test(profile.phone.replace(/\s+/g, ''))) problems.push('Enter a valid 10-digit mobile number.');
    setErrors(problems);
    if (problems.length) return;
    updateProfile({ ...profile, name: profile.name.trim(), phone: profile.phone.replace(/\s+/g, '') });
    toast('Profile saved');
  };

  const savePreferences = () => {
    const days = Number(warnDays);
    if (!Number.isInteger(days) || days < 1 || days > 365) {
      setErrors(['License warning window must be a whole number of days between 1 and 365.']);
      return;
    }
    setErrors([]);
    updateSettings({ companyName: companyName.trim() || 'TransitOps', licenseWarnDays: days });
    toast('Preferences saved');
  };

  const setTheme = (theme) => {
    if (theme !== data.settings.theme) updateSettings({ theme });
  };

  return (
    <>
      <div className="page-head">
        <div>
          <h2>Settings</h2>
          <p>Profile, appearance and basic preferences. Changes are saved in this browser.</p>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-head">
            <div>
              <h3>
                <UserRound size={16} style={{ verticalAlign: 'text-bottom', marginRight: 6 }} />
                User profile (demo)
              </h3>
              <small>Shown in the header. No login is required yet.</small>
            </div>
            <div className="avatar" style={{ width: 48, height: 48, fontSize: 16 }}>
              {profile.name
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((p) => p[0])
                .join('')
                .toUpperCase()}
            </div>
          </div>
          <ErrorList errors={errors} />
          <div className="form-grid">
            <Field label="Full name" full>
              <input value={profile.name} onChange={setP('name')} />
            </Field>
            <Field label="Role">
              <input value={profile.role} onChange={setP('role')} />
            </Field>
            <Field label="Mobile">
              <input value={profile.phone} onChange={setP('phone')} maxLength={12} />
            </Field>
            <Field label="Email" full>
              <input type="email" value={profile.email} onChange={setP('email')} />
            </Field>
          </div>
          <div className="profile-form-actions">
            <button className="btn btn-primary" onClick={saveProfile}>
              <Save size={16} /> Save profile
            </button>
          </div>
        </div>

        <div className="stack">
          <div className="card">
            <div className="card-head">
              <div>
                <h3>Appearance</h3>
                <small>Light or dark mode applies across the app</small>
              </div>
            </div>
            <div className="setting-row">
              <div>
                <div style={{ fontWeight: 600 }}>Theme</div>
                <div className="muted-text" style={{ fontSize: 12 }}>Currently {isDark ? 'dark' : 'light'}</div>
              </div>
              <div className="segmented">
                <button className={!isDark ? 'on' : ''} onClick={() => setTheme('light')}>
                  <Sun size={15} /> Light
                </button>
                <button className={isDark ? 'on' : ''} onClick={() => setTheme('dark')}>
                  <Moon size={15} /> Dark
                </button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-head">
              <div>
                <h3>Preferences</h3>
                <small>Basic app settings</small>
              </div>
            </div>
            <div className="setting-row">
              <div>
                <div style={{ fontWeight: 600 }}>Company name</div>
                <div className="muted-text" style={{ fontSize: 12 }}>Used in exports and headings</div>
              </div>
              <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} style={{ maxWidth: 240 }} />
            </div>
            <div className="setting-row">
              <div>
                <div style={{ fontWeight: 600 }}>License warning window</div>
                <div className="muted-text" style={{ fontSize: 12 }}>Days before expiry to flag a license</div>
              </div>
              <div className="field" style={{ maxWidth: 120 }}>
                <input type="number" min="1" max="365" value={warnDays} onChange={(e) => setWarnDays(e.target.value)} />
              </div>
            </div>
            <div className="profile-form-actions">
              <button className="btn btn-primary" onClick={savePreferences}>
                <Save size={16} /> Save preferences
              </button>
            </div>
          </div>

          <div className="card danger-zone">
            <div className="card-head">
              <div>
                <h3>Demo data</h3>
                <small>Restore the original sample vehicles, drivers, trips and records</small>
              </div>
            </div>
            <button className="btn btn-danger" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={16} /> Reset demo data
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmReset}
        title="Reset all demo data?"
        message="All vehicles, drivers, trips, maintenance, fuel and expense records you added will be replaced with the sample data. This cannot be undone."
        confirmLabel="Reset data"
        danger
        onConfirm={() => {
          resetDemo();
          setConfirmReset(false);
          toast('Demo data restored');
        }}
        onCancel={() => setConfirmReset(false)}
      />
    </>
  );
}
