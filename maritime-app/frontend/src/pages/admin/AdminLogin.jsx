import { useState }           from 'react';
import { useNavigate }        from 'react-router-dom';
import { useAuth }            from '../../contexts/AuthContext';
import { authAPI }            from '../../services/api';
import { SteeringWheel }      from '../../App';

export default function AdminLogin() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: '', password: '', accessKey: '' });
  const [err,  setErr]  = useState('');
  const [busy, setBusy] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr(''); setBusy(true);
    try {
      const res = await authAPI.adminLogin(form);
      login(res.user, res.token);
      navigate('/admin/dashboard');
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <SteeringWheel size={64} color="white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-1">Department of Maritime Transport and Logistics</p>
        </div>

        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Administrator Login</h2>

          {err && <div className="bg-red-900/50 text-red-300 text-sm px-4 py-3 rounded-lg mb-4 border border-red-700">{err}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
              <input name="email" type="email" value={form.email} onChange={handle} required
                     className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
              <input name="password" type="password" value={form.password} onChange={handle} required
                     className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Department Access Key</label>
              <input name="accessKey" type="password" value={form.accessKey} onChange={handle} required
                     placeholder="Provided by department"
                     className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" disabled={busy}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition disabled:opacity-50 mt-2">
              {busy ? 'Signing in…' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
