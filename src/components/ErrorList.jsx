import { AlertTriangle } from 'lucide-react';

export default function ErrorList({ errors, title = 'Please fix the following:' }) {
  if (!errors || errors.length === 0) return null;
  return (
    <div className="error-box" role="alert">
      <div className="error-title">
        <AlertTriangle size={16} /> {title}
      </div>
      <ul>
        {errors.map((e, i) => (
          <li key={i}>{e}</li>
        ))}
      </ul>
    </div>
  );
}
