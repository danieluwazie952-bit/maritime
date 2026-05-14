import { useState }             from 'react';
import { Link, useNavigate }    from 'react-router-dom';
import { useAuth }              from '../../contexts/AuthContext';
import { authAPI }              from '../../services/api';
import { SteeringWheel }        from '../../App';

export default function Login() {
  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const res = await authAPI.login(form);
      login(res.user, res.token);
      navigate('/dashboard');
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SteeringWheel size={64} color="#1d4ed8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Maritime Portal</h1>
          <p className="text-gray-500 text-sm mt-1">Department of Maritime Transport and Logistics</p>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-6">Student Login</h2>

          {err && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{err}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Email Address</label>
              <input name="email" type="email" className="input" value={form.email}
                     onChange={handle} required placeholder="student@example.com" />
            </div>
            <div>
              <label className="label">Password</label>
              <input name="password" type="password" className="input" value={form.password}
                     onChange={handle} required placeholder="••••••••" />
            </div>
            <button type="submit" className="btn-primary w-full mt-2" disabled={busy}>
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don't have an account?{' '}
            <Link to="/signup" className="text-blue-700 font-medium hover:underline">Sign Up</Link>
          </p>
          <p className="text-center text-sm text-gray-400 mt-2">
            Admin?{' '}
            <Link to="/admin" className="text-gray-500 hover:underline">Admin Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
