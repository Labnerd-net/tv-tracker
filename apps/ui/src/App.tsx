import { BrowserRouter } from 'react-router';
import { ThemeProvider } from './contexts/theme/ThemeProvider.tsx';
import { AuthProvider } from './contexts/auth/AuthProvider.tsx';
import { AlertProvider } from './contexts/alert/AlertProvider.tsx';
import { ShowProvider } from './contexts/show/ShowProvider.tsx';
import AppContent from './AppContent.tsx';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AlertProvider>
            <ShowProvider>
              <AppContent />
            </ShowProvider>
          </AlertProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
