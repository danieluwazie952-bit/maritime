import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminAPI }               from '../../services/api';
import { SteeringWheel }          from '../../App';

const PAYMENT_LABELS = {
  national_association: 'NAMS Due',
  department:           'Department Due',
  college:              'College Due',
  national_institute:   'NIMTL Due',
};

export default function StudentDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [data,    setData]    = useState(null);
  const [matric,  setMatric]  = useState('');
  const [jamb,    setJamb]    = useState('');
  const [msg,     setMsg]     = useState('');
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    adminAPI.student(id).then((res) => {
      setData(res);
      setMatric(res.student.matricNumber || '');
      setJamb(res.student.jambRegNumber  || '');
    });
  }, [id]);

  const saveMatric = async () => {
    try {
      await adminAPI.updateMatric(id, { matricNumber: matric, jambRegNumber: jamb });
      setMsg('Updated successfully!');
      setEditing(false);
    } catch (e) { setMsg(e.message); }
  };

  if (!data) return (
    <div className="min-h-screen flex items-center justify-center">
      <SteeringWheel size={50} color="#1d4ed8" spin />
    </div>
  );

  const { student, payments, documents } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-blue-900 text-white px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin/dashboard')} className="text-blue-200 hover:text-white text-sm">
          ← Back
        </button>
        <SteeringWheel size={28} color="white" />
        <span className="font-bold">Student Detail</span>
      </nav>

      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-6">

        {msg && (
          <div className={`px-4 py-3 rounded-lg text-sm ${msg.includes('success') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {msg}
          </div>
        )}

        {/* Profile */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-gray-800 text-lg">Student Profile</h2>
            <span className={student.isVerified ? 'badge-green' : 'badge-red'}>
              {student.isVerified ? 'Email Verified' : 'Not Verified'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            {[
              ['Full Name', student.fullName],
              ['Email',     student.email],
              ['Level',     `${student.level} Level`],
              ['Phone',     student.phone || '—'],
              ['Department',    student.department    || '—'],
              ['State of Origin', student.stateOfOrigin || '—'],
            ].map(([k, v]) => (
              <div key={k}>
                <p className="text-gray-400 text-xs mb-0.5">{k}</p>
                <p className="font-medium text-gray-800">{v}</p>
              </div>
            ))}
          </div>

          {/* Matric / JAMB edit */}
          <div className="mt-5 pt-5 border-t border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700 text-sm">Identification Numbers</h3>
              <button onClick={() => setEditing(!editing)}
                      className="text-xs text-blue-600 hover:underline font-medium">
                {editing ? 'Cancel' : 'Edit'}
              </button>
            </div>
            {editing ? (
              <div className="flex flex-col md:flex-row gap-3">
                <input className="input" placeholder="Matric Number" value={matric}
                       onChange={(e) => setMatric(e.target.value)} />
                <input className="input" placeholder="JAMB Reg. Number" value={jamb}
                       onChange={(e) => setJamb(e.target.value)} />
                <button onClick={saveMatric} className="btn-primary whitespace-nowrap">Save</button>
              </div>
            ) : (
              <div className="flex gap-6 text-sm">
                <div>
                  <p className="text-gray-400 text-xs">Matric Number</p>
                  <p className="font-medium text-gray-800">{student.matricNumber || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs">JAMB Reg. Number</p>
                  <p className="font-medium text-gray-800">{student.jambRegNumber || '—'}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Payments */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-4">Payment History</h2>
          {payments.length > 0 ? (
            <div className="divide-y divide-gray-100 text-sm">
              {payments.map((p) => (
                <div key={p._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{PAYMENT_LABELS[p.type] || p.type}</p>
                    <p className="text-gray-400 text-xs">{new Date(p.createdAt).toLocaleDateString()} · Ref: {p.txRef}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-800">₦{p.amount?.toLocaleString()}</span>
                    <span className={p.status === 'success' ? 'badge-green' : p.status === 'failed' ? 'badge-red' : 'badge-gray'}>
                      {p.status}
                    </span>
                    {p.receiptUrl && (
                      <a href={p.receiptUrl} target="_blank" rel="noreferrer"
                         className="text-blue-600 text-xs hover:underline">Receipt</a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No payments yet.</p>}
        </div>

        {/* Documents */}
        <div className="card">
          <h2 className="font-bold text-gray-800 mb-4">Submitted Documents ({documents.length})</h2>
          {documents.length > 0 ? (
            <div className="divide-y divide-gray-100 text-sm">
              {documents.map((d) => (
                <div key={d._id} className="py-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-800">{d.name}</p>
                    <p className="text-gray-400 text-xs capitalize">{d.category} · {new Date(d.createdAt).toLocaleDateString()}</p>
                  </div>
                  <a href={d.fileUrl} target="_blank" rel="noreferrer"
                     className="btn-outline text-xs px-3 py-1.5">Download</a>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-400 text-sm">No documents uploaded.</p>}
        </div>
      </div>
    </div>
  );
}
