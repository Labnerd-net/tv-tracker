import { useEffect } from 'react';
import { MyProviders } from './contexts/Providers.tsx';
import { BrowserRouter, Routes, Route } from 'react-router';
import AppAlert from './components/AppAlert.tsx';
import NavOffcanvas from './components/NavOffcanvas.tsx';
import Login from './components/Login.tsx';
import AllShows from './pages/AllShows.tsx';
import OneShow from './pages/OneShow.tsx';
import SearchResults from './pages/SearchResults.tsx';
import OneShowSearch from './pages/OneShowSearch.tsx';
// import ProtectedRoute from './pages/ProtectedRoute.tsx';
import * as Api from './apis/requests.ts';
import { useAuthProps } from './contexts/propsFactory.ts';
import { useAlertProps } from './contexts/propsFactory.ts';
import { useViewProps }  from './contexts/propsFactory.ts';
import { useDataProps }  from './contexts/propsFactory.ts';

export default function App() {
  const authProps   = useAuthProps();
  const alertProps  = useAlertProps();
  const viewProps   = useViewProps();
  const dataProps   = useDataProps();

  useEffect(() => {
    const retreiveTvShows = async () => {
      try {
        const response = await Api.getAllShows();
        console.log(response);
        dataProps.setTvShows(response);
      } catch (err) {
        alertProps.setAlertVariant('danger');
        alertProps.setAlertMessage('Failed to retreive TV Shows');
        alertProps.showAlert();
        console.error(err);
      }
    };
    retreiveTvShows();
  }, [alertProps, dataProps]);

  return (
    <div style={{ minHeight: '100vh' }}>
      <BrowserRouter>
        <MyProviders authProps={authProps} alertProps={alertProps} dataProps={dataProps} viewProps={viewProps}>
          <NavOffcanvas />
          {alertProps.visibleAlert && <AppAlert alertVariant={alertProps.alertVariant} alertMessage={alertProps.alertMessage} />}
          <Routes>
            <Route path='/login' element={<Login />} />
            <Route path='/' element={
              // <ProtectedRoute>
                <AllShows />
              // </ProtectedRoute>
            } />
            <Route path='/tvshow/:showID' element={
              // <ProtectedRoute>
                <OneShow />
              // </ProtectedRoute>
            } />
            <Route path='/search/:showName' element={
              // <ProtectedRoute>
                <SearchResults />
              // </ProtectedRoute>
            } />
            <Route path='/search/show/:showID' element={
              // <ProtectedRoute>
                <OneShowSearch />
              // </ProtectedRoute>
            } />
          </Routes>
        </MyProviders>
      </BrowserRouter>
    </div>
  )
}
