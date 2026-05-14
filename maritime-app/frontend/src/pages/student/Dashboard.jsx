import { useState, useEffect, useRef } from 'react';
import { useNavigate }                 from 'react-router-dom';
import { useAuth }                     from '../../contexts/AuthContext';
import { studentAPI, paymentAPI }      from '../../services/api';
import { SteeringWheel }               from '../../App';

const TABS = ['Payments', 'Documents', '100L Onboarding'];

const PAYMENT_TYPES = [
  { key: 'national_association', label: 'National Association of Maritime Students Due', icon: '🏛️' },
  { key: 'department',           label: 'Department Due',                                 icon: '🏢' },
  { key: 'college',              label: 'College Due',                                    icon: '🎓' },
  { key: 'national_institute',   label: 'National Institute of Maritime Transport Due',   icon: '⚓' },
];

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [tab,      setTab]      = useState('Payments');
  const [profile,  setProfile]  = useState(null);
  const [payments, setPayments] = useState([]);
  const [amounts,  setAmounts]  = useState({});
  const [docs,     setDocs]     = useState([]);
  const [msg,      setMsg]      = useState('');
  const [busy,     setBusy]     = useState('');
  const fileRef = useRef();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [p, pay, d] = await Promise.all([studentAPI.profile(), paymentAPI.list(), studentAPI.documents()]);
      setProfile(p.user);
      setPayments(pay.payments);
      setAmounts(pay.amounts || {});
      setDocs(d.documents);
    } catch {}
  };

  // ── Pay via Flutterwave Inline ──────────────────────────────────────────────
  const pay = async (type) => {
    setMsg(''); setBusy(type);
    try {
      const data = await paymentAPI.initiate(type);
      setBusy('');
      window.FlutterwaveCheckout({
        public_key:      data.publicKey,
        tx_ref:          data.txRef,
        amount:          data.amount,
        currency:        data.currency,
        payment_options: 'card,banktransfer,ussd',
        customer:        { email: data.customerEmail, name: data.customerName, phone_number: data.customerPhone },
        customizations:  { title: 'Maritime Department', description: data.label, logo: '' },
        callback: async (response) => {
          if (response.status === 'successful') {
            setBusy('verify');
            try {
              const v = await paymentAPI.verify({ transaction_id: response.transaction_id, tx_ref: response.tx_ref });
              setMsg(`✓ ${v.message}`);
              load();
            } catch (e) { setMsg(`Error: ${e.message}`); }
            finally { setBusy(''); }
          }
        },
        onclose: () => setBusy(''),
      });
    } catch (e) { setMsg(e.message); setBusy(''); }
  };

  // ── Upload document ─────────────────────────────────────────────────────────
  const uploadDoc = async (e, category, name) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file); fd.append('category', category); fd.append('name', name || file.name);
    setBusy('upload');
    try {
      await studentAPI.upload(fd);
      setMsg('Document uploaded successfully!');
      load();
    } catch (e) { setMsg(e.message); }
    finally { setBusy(''); e.target.value = ''; }
  };

  // ── Upload onboarding item ──────────────────────────────────────────────────
  const uploadOnboarding = async (file, itemName) => {
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file); fd.append('itemName', itemName);
    setBusy(itemName);
    try {
      const res = await studentAPI.uploadOnboarding(fd);
      setMsg(`Uploaded: ${itemName}`);
      setProfile((p) => ({ ...p, onboarding: res.onboarding }));
    } catch (e) { setMsg(e.message); }
    finally { setBusy(''); }
  };

  const isPaid = (type) => payments.some((p) => p.type === type && p.status === 'success');

  if (!profile) return (
    <div className="min-h-screen flex items-center justify-center">
      <SteeringWheel size={60} color="#1d4ed8" spin />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-800 text-white px-6 py-4 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <SteeringWheel size={36} color="white" />
          <span className="font-bold text-sm md:text-base">Maritime Portal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm hidden md:block">{profile.fullName}</span>
          <button onClick={() => { logout(); navigate('/login'); }}
                  className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto p-4 md:p-8">
        {/* Profile card */}
        <div className="card mb-6 flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-blue-700 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
            {profile.fullName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-gray-900 text-lg truncate">{profile.fullName}</h2>
            <p className="text-gray-500 text-sm">{profile.email}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            <span className="badge-gray">Level {profile.level}</span>
            {profile.matricNumber  && <span className="badge-gray">Matric: {profile.matricNumber}</span>}
            {profile.jambRegNumber && <span className="badge-gray">JAMB: {profile.jambRegNumber}</span>}
            {profile.department    && <span className="badge-gray">{profile.department}</span>}
          </div>
        </div>

        {/* Feedback msg */}
        {msg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {(profile.level === '100' ? TABS : TABS.slice(0, 2)).map((t) => (
            <button key={t} onClick={() => setTab(t)}
                    className={`px-4 py-2.5 text-sm font-medium border-b-2 transition ${
                      tab === t ? 'border-blue-700 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t}
            </button>
          ))}
        </div>

        {/* ── PAYMENTS TAB ── */}
        {tab === 'Payments' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PAYMENT_TYPES.map(({ key, label, icon }) => {
              const paid     = isPaid(key);
              const receipt  = payments.find((p) => p.type === key && p.status === 'success');
              const amount   = amounts[key] || 0;
              return (
                <div key={key} className={`card border-l-4 ${paid ? 'border-l-green-500' : 'border-l-blue-500'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{icon}</span>
                    {paid ? <span className="badge-green">Paid</span> : <span className="badge-gray">Pending</span>}
                  </div>
                  <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1">{label}</h3>
                  <p className="text-2xl font-bold text-blue-700 mb-3">₦{amount.toLocaleString()}</p>
                  {paid ? (
                    receipt?.receiptUrl && (
                      <a href={receipt.receiptUrl} target="_blank" rel="noreferrer"
                         className="text-sm text-blue-600 hover:underline">Download Receipt →</a>
                    )
                  ) : (
                    <button onClick={() => pay(key)} disabled={!!busy}
                            className="btn-primary w-full">
                      {busy === key ? 'Preparing…' : 'Pay Now'}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── DOCUMENTS TAB ── */}
        {tab === 'Documents' && (
          <div>
            <div className="card mb-4">
              <h3 className="font-semibold text-gray-800 mb-3">Upload Document</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['course_form', 'payment_receipt'].map((cat) => (
                  <label key={cat} className="border-2 border-dashed border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 transition block">
                    <p className="text-sm font-medium text-gray-700 mb-1 capitalize">{cat.replace('_', ' ')}</p>
                    <p className="text-xs text-gray-400">PDF, JPG or PNG · Max 5MB</p>
                    <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                           onChange={(e) => uploadDoc(e, cat)} disabled={!!busy} />
                  </label>
                ))}
              </div>
            </div>

            {docs.length > 0 ? (
              <div className="card">
                <h3 className="font-semibold text-gray-800 mb-3">Uploaded Documents ({docs.length})</h3>
                <div className="divide-y divide-gray-100">
                  {docs.map((d) => (
                    <div key={d._id} className="py-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{d.name}</p>
                        <p className="text-xs text-gray-400">{d.category} · {new Date(d.createdAt).toLocaleDateString()}</p>
                      </div>
                      <a href={d.fileUrl} target="_blank" rel="noreferrer"
                         className="text-sm text-blue-600 hover:underline">View</a>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-8">No documents uploaded yet.</p>
            )}
          </div>
        )}

        {/* ── 100L ONBOARDING TAB ── */}
        {tab === '100L Onboarding' && profile.level === '100' && (
          <div className="card">
            <h3 className="font-semibold text-gray-800 mb-1">100-Level Onboarding Checklist</h3>
            <p className="text-xs text-gray-400 mb-4">Upload each required document. PDF, JPG, or PNG accepted.</p>
            <div className="space-y-3">
              {profile.onboarding?.map((item) => (
                <div key={item.name}
                     className={`flex items-center justify-between p-3 rounded-lg border ${
                       item.status === 'uploaded' ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-lg flex-shrink-0 ${item.status === 'uploaded' ? 'text-green-500' : 'text-gray-300'}`}>
                      {item.status === 'uploaded' ? '✓' : '○'}
                    </span>
                    <span className="text-sm text-gray-700 truncate">{item.name}</span>
                  </div>
                  {item.status !== 'uploaded' && (
                    <label className="flex-shrink-0 ml-3 cursor-pointer">
                      <span className="text-xs text-blue-600 hover:underline font-medium">
                        {busy === item.name ? 'Uploading…' : 'Upload'}
                      </span>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png"
                             onChange={(e) => uploadOnboarding(e.target.files[0], item.name)}
                             disabled={!!busy} />
                    </label>
                  )}
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-4">
              {profile.onboarding?.filter((i) => i.status === 'uploaded').length || 0} of {profile.onboarding?.length || 0} completed
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
