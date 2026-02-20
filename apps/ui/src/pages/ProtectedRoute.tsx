import { useNavigate } from 'react-router';
import { AuthContext } from '../contexts/Contexts';
import { useContext } from 'react';

export default function ProtectedRoute({ children }: {children: React.ReactNode}) {
  const navigate = useNavigate();
  const authProps = useContext(AuthContext)

  if (!authProps.isAuthenticated) {
    navigate(`/login`);
  }

  return children;
}