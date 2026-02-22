import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/auth/AuthContext';

export default function ProtectedRoute({ children }: {children: React.ReactNode}) {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) {
    navigate(`/login`);
  }

  return children;
}