import { useState, useEffect } from 'react';
import { authAPI, adminAPI }   from '../services/api';
import { SteeringWheel }       from '../App';

export default function SuperAdmin() {
  const [authed,   setAuthed]   = useState(false);
  const [password, setPassword] = useState('');
  const [err,      setErr]      = useState('');
  const [settings, setSettings] = useState(null);
  const [form,     setForm]     = useState({});
  const [session,  setSession]  = useState('');
  const [msg,      setMsg]      = useState('');
  const [busy,     setBusy]     = useState(false);

  const LABELS = {
    national_association: 'National Association of Maritime Students Due',
    department:           'Department Due',
    college:              'College Due',
    national_institute:   'National Institute of Maritime Transport and Logistics Due',
  };

  const doLogin = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      const res = await authAPI.superLogin({ password });
      localStorage.setItem('maritime_token', res.token);
      setAuthed(true);
      loadSettings();
    } catch (e) { setErr(e.message); }
  };

  const loadSettings = async () => {
    try {
      const res = await adminAPI.getSettings();
      setSettings(res.settings);
      setForm({ ...res.settings.paymentAmounts });
      setSession(res.settings.academicSession || '');
    } catch (e) { setErr(e.message); }
  };

  const save = async (e) => {
    e.preventDefault();
    setBusy(true); setMsg('');
    try {
      const amounts = {};
      Object.keys(form).forEach((k) => { amounts[k] = parseFloat(form[k]) || 0; });
      await adminAPI.updateSettings({ paymentAmounts: amounts, academicSession: session });
      setMsg('Settings saved successfully!');
    } catch (e) { setMsg(e.message); }
    finally { setBusy(false); }
  };

  if (!authed) return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <SteeringWheel size={60} color="#3b82f6" />
          <h1 className="text-white text-xl font-bold mt-4">Developer Access</h1>
          <p className="text-gray-500 text-xs mt-1">Restricted area</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
          {err && <p className="text-red-400 text-sm mb-4">{err}</p>}
          <form onSubmit={doLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Access Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                     className="w-full bg-gray-800 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition">
              Access
            </button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <SteeringWheel size={36} color="#3b82f6" />
          <div>
            <h1 className="text-white font-bold text-xl">Super Admin</h1>
            <p className="text-gray-400 text-xs">Core configuration</p>
          </div>
        </div>

        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-lg text-sm ${msg.includes('success') ? 'bg-green-900/50 text-green-300 border border-green-700' : 'bg-red-900/50 text-red-300 border border-red-700'}`}>
            {msg}
          </div>
        )}

        {settings && (
          <form onSubmit={save} className="space-y-6">
            {/* Academic Session */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Academic Session</h2>
              <input value={session} onChange={(e) => setSession(e.target.value)}
                     className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                     placeholder="e.g. 2024/2025" />
            </div>

            {/* Payment Amounts */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
              <h2 className="text-white font-semibold mb-4">Payment Amounts (₦)</h2>
              <div className="space-y-4">
                {Object.keys(LABELS).map((key) => (
                  <div key={key} className="flex items-center gap-4">
                    <label className="text-gray-300 text-sm flex-1">{LABELS[key]}</label>
                    <input type="number" min="0" value={form[key] || ''}
                           onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                           className="w-32 bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" disabled={busy}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
              {busy ? 'Saving…' : 'Save Settings'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
