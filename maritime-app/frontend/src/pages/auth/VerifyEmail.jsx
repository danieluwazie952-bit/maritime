import { useEffect, useState }     from 'react';
import { useParams, useNavigate }  from 'react-router-dom';
import { authAPI }                 from '../../services/api';
import { SteeringWheel }           from '../../App';

export default function VerifyEmail() {
  const { token } = useParams();
  const navigate  = useNavigate();
  const [state, setState] = useState('loading'); // 'loading' | 'success' | 'error'
  const [msg,   setMsg]   = useState('');

  useEffect(() => {
    authAPI.verify(token)
      .then((res) => { setState('success'); setMsg(res.message); })
      .catch((e)  => { setState('error');   setMsg(e.message);   });
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          {state === 'loading' && <SteeringWheel size={60} color="#1d4ed8" spin />}
          {state === 'success' && <div className="text-5xl text-green-500">✓</div>}
          {state === 'error'   && <div className="text-5xl text-red-500">✗</div>}
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">
          {state === 'loading' && 'Verifying your email…'}
          {state === 'success' && 'Email Verified!'}
          {state === 'error'   && 'Verification Failed'}
        </h2>
        <p className="text-gray-500 text-sm mb-6">{msg}</p>
        {state !== 'loading' && (
          <button onClick={() => navigate('/login')} className="btn-primary">
            Go to Login
          </button>
        )}
      </div>
    </div>
  );
}
