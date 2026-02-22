import { BrowserRouter, Routes, Route } from 'react-router';
import AppAlert from './components/AppAlert.tsx';
import Navbar from './components/Navbar.tsx';
import Splash from './pages/Splash.tsx';
import Login from './pages/Login.tsx';
import Registration from './pages/Registration.tsx';
import AllShows from './pages/AllShows.tsx';
import OneShow from './pages/OneShow.tsx';
import SearchResults from './pages/SearchResults.tsx';
import OneShowSearch from './pages/OneShowSearch.tsx';
import { useAlert } from './contexts/alert/AlertContext.tsx';

export default function AppContent() {
  const alertProps  = useAlert();

  return (
    <BrowserRouter>
      <Navbar />
      {alertProps.visibleAlert && <AppAlert alertVariant={alertProps.alertVariant} alertMessage={alertProps.alertMessage} />}
      <Routes>
        <Route path='/' element={<Splash />} />
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Registration />} />
        <Route path='/dashboard' element={<AllShows />} />
        <Route path='/tvshow/:showID' element={<OneShow />} />
        <Route path='/search/:showName' element={<SearchResults />} />
        <Route path='/search/show/:showID' element={<OneShowSearch />} />
      </Routes>
    </BrowserRouter>
  )
}
