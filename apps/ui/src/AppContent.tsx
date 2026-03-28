import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router';
import AppAlert from './components/AppAlert.tsx';
import Navbar from './components/Navbar.tsx';
import ProtectedRoute from './pages/ProtectedRoute.tsx';
import { useAlert } from './contexts/alert/AlertContext.tsx';

const Splash = lazy(() => import('./pages/Splash.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Registration = lazy(() => import('./pages/Registration.tsx'));
const AllShows = lazy(() => import('./pages/AllShows.tsx'));
const OneShow = lazy(() => import('./pages/OneShow.tsx'));
const SearchResults = lazy(() => import('./pages/SearchResults.tsx'));
const OneShowSearch = lazy(() => import('./pages/OneShowSearch.tsx'));

export default function AppContent() {
  const alertProps  = useAlert();

  return (
    <>
      <Navbar />
      {alertProps.visibleAlert && <AppAlert alertVariant={alertProps.alertVariant} alertMessage={alertProps.alertMessage} />}
      <Suspense fallback={null}>
        <Routes>
          <Route path='/' element={<Splash />} />
          <Route path='/login' element={<Login />} />
          <Route path='/register' element={<Registration />} />
          <Route path='/dashboard' element={<ProtectedRoute><AllShows /></ProtectedRoute>} />
          <Route path='/tvshow/:showID' element={<ProtectedRoute><OneShow /></ProtectedRoute>} />
          <Route path='/search/:showName' element={<ProtectedRoute><SearchResults /></ProtectedRoute>} />
          <Route path='/search/show/:showID' element={<ProtectedRoute><OneShowSearch /></ProtectedRoute>} />
        </Routes>
      </Suspense>
    </>
  )
}
