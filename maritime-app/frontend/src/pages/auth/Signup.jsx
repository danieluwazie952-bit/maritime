import { useState }           from 'react';
import { Link, useNavigate }  from 'react-router-dom';
import { authAPI }            from '../../services/api';
import { SteeringWheel }      from '../../App';

export default function Signup() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    matricNumber: '', jambRegNumber: '', level: '100', phone: '',
  });
  const [err,     setErr]     = useState('');
  const [success, setSuccess] = useState('');
  const [busy,    setBusy]    = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (form.password !== form.confirmPassword) return setErr('Passwords do not match');
    if (!form.matricNumber && !form.jambRegNumber)
      return setErr('Please provide either a Matric Number or JAMB Registration Number');
    setBusy(true);
    try {
      const res = await authAPI.register(form);
      setSuccess(res.message);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  if (success) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        <div className="text-green-600 text-5xl mb-4">✓</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Registration Successful!</h2>
        <p className="text-gray-600 text-sm mb-6">{success}</p>
        <button onClick={() => navigate('/login')} className="btn-primary">Go to Login</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <SteeringWheel size={56} color="#1d4ed8" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-gray-500 text-sm">Maritime Transport &amp; Logistics Portal</p>
        </div>

        <div className="card">
          {err && <div className="bg-red-50 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{err}</div>}

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="label">Full Name <span className="text-red-500">*</span></label>
                <input name="fullName" className="input" value={form.fullName} onChange={handle} required
                       placeholder="As it appears on school records" />
              </div>
              <div className="md:col-span-2">
                <label className="label">Email Address <span className="text-red-500">*</span></label>
                <input name="email" type="email" className="input" value={form.email} onChange={handle} required />
              </div>
              <div>
                <label className="label">Password <span className="text-red-500">*</span></label>
                <input name="password" type="password" className="input" value={form.password} onChange={handle} required />
              </div>
              <div>
                <label className="label">Confirm Password <span className="text-red-500">*</span></label>
                <input name="confirmPassword" type="password" className="input" value={form.confirmPassword} onChange={handle} required />
              </div>
              <div>
                <label className="label">Matric Number</label>
                <input name="matricNumber" className="input" value={form.matricNumber} onChange={handle}
                       placeholder="e.g. MAT/2021/001" />
              </div>
              <div>
                <label className="label">JAMB Reg. Number</label>
                <input name="jambRegNumber" className="input" value={form.jambRegNumber} onChange={handle}
                       placeholder="e.g. 12345678AB" />
              </div>
              <div>
                <label className="label">Level</label>
                <select name="level" className="input" value={form.level} onChange={handle}>
                  {['100','200','300','400','500'].map(l => <option key={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Phone Number</label>
                <input name="phone" className="input" value={form.phone} onChange={handle}
                       placeholder="08xxxxxxxxx" />
              </div>
            </div>

            <p className="text-xs text-gray-400">
              * Matric/JAMB numbers can only be edited by an admin after verification.
            </p>

            <button type="submit" className="btn-primary w-full" disabled={busy}>
              {busy ? 'Creating account…' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-700 font-medium hover:underline">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
