import { useState, useEffect } from 'react';
import { useNavigate }         from 'react-router-dom';
import { useAuth }             from '../../contexts/AuthContext';
import { adminAPI }            from '../../services/api';
import { SteeringWheel }       from '../../App';

export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const navigate          = useNavigate();
  const [stats,    setStats]    = useState(null);
  const [students, setStudents] = useState([]);
  const [search,   setSearch]   = useState('');
  const [loading,  setLoading]  = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, st] = await Promise.all([adminAPI.stats(), adminAPI.students()]);
      setStats(s.stats);
      setStudents(st.students);
    } catch {}
    setLoading(false);
  };

  const filtered = students.filter((s) =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    (s.matricNumber || '').toLowerCase().includes(search.toLowerCase())
  );

  const PAYMENT_KEYS = ['national_association', 'department', 'college', 'national_institute'];
  const paymentShort = { national_association: 'NAMS', department: 'Dept', college: 'College', national_institute: 'NIMTL' };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <SteeringWheel size={60} color="#1d4ed8" spin />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-blue-900 text-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SteeringWheel size={34} color="white" />
          <span className="font-bold">Admin Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-blue-200 text-sm hidden md:block">{user?.fullName}</span>
          <button onClick={() => { logout(); navigate('/admin'); }}
                  className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Total Students',    value: stats.totalStudents,    color: 'blue'  },
              { label: 'Verified',          value: stats.verifiedStudents, color: 'green' },
              { label: 'Payments Made',     value: stats.successPayments,  color: 'blue'  },
              { label: 'Total Documents',   value: stats.totalDocs,        color: 'gray'  },
            ].map((s) => (
              <div key={s.label} className="card text-center">
                <p className={`text-3xl font-bold text-${s.color}-700 mb-1`}>{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Student Table */}
        <div className="card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <h2 className="font-bold text-gray-800 text-lg">Registered Students ({students.length})</h2>
            <input type="text" placeholder="Search by name, email, matric…"
                   className="input max-w-xs" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 font-semibold text-gray-600">Student</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Matric / JAMB</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Level</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Verified</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Payments</th>
                  <th className="px-4 py-3 font-semibold text-gray-600">Docs</th>
                  <th className="px-4 py-3 font-semibold text-gray-600"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((s) => (
                  <tr key={s._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{s.fullName}</p>
                      <p className="text-gray-400 text-xs">{s.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.matricNumber || s.jambRegNumber || <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge-gray">{s.level}L</span>
                    </td>
                    <td className="px-4 py-3">
                      {s.isVerified ? <span className="badge-green">Yes</span> : <span className="badge-red">No</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {PAYMENT_KEYS.map((k) => {
                          const paid = s.payments?.some((p) => p.type === k);
                          return (
                            <span key={k} className={paid ? 'badge-green' : 'badge-gray'} title={k}>
                              {paymentShort[k]}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.documentCount}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/admin/students/${s._id}`)}
                              className="text-blue-600 hover:underline text-xs font-medium">
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="text-center py-10 text-gray-400">No students found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
