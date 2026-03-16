import { Navigate } from 'react-router';
import { useAuth } from '../contexts/auth/AuthContext';

export default function ProtectedRoute({ children }: {children: React.ReactNode}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
