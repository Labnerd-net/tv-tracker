import { MyProviders } from './contexts/Providers.tsx';
import { BrowserRouter, Routes, Route } from 'react-router';
import AppAlert from './components/AppAlert.tsx';
import NavOffcanvas from './components/NavOffcanvas.tsx';
import Splash from './pages/Splash.tsx';
import Login from './pages/Login.tsx';
import Registration from './pages/Registration.tsx';
import AllShows from './pages/AllShows.tsx';
import OneShow from './pages/OneShow.tsx';
import SearchResults from './pages/SearchResults.tsx';
import OneShowSearch from './pages/OneShowSearch.tsx';
import { useAlertProps } from './contexts/propsFactory.ts';
import { useViewProps }  from './contexts/propsFactory.ts';
import { useDataProps }  from './contexts/propsFactory.ts';
import { ThemeProvider } from './contexts/theme/ThemeProvider.tsx';
import { AuthProvider } from './contexts/auth/AuthProvider.tsx';

export default function App() {
  const alertProps  = useAlertProps();
  const viewProps   = useViewProps();
  const dataProps   = useDataProps();

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <MyProviders alertProps={alertProps} dataProps={dataProps} viewProps={viewProps}>
            <NavOffcanvas />
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
          </MyProviders>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  )
}
