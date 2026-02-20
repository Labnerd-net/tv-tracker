import { useState } from 'react';
import type { AlertProps } from '../types/alert';
import type { ViewProps } from '../types/view';
import type { DataProps } from '../types/data';
import type { ShowData } from '@shared/types/tv-tracker';

export const useAlertProps = (): AlertProps => {
  const [visibleAlert, setVisibleAlert] = useState(false);
  const [alertVariant, setAlertVariant] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  
  const showAlert = () => {
    setVisibleAlert(true);
    setTimeout( () => {
      setVisibleAlert(false);
    }, 5000);
  };
  
  return { 
     visibleAlert, 
     alertVariant, setAlertVariant, 
     alertMessage, setAlertMessage, 
     showAlert,
  };
}

export const useViewProps = (): ViewProps => {
  const [viewValue, setViewValue] = useState('card');
  const views = [
    { viewName: 'Card View', value: 'card' },
    { viewName: 'Table View', value: 'table' },
  ];

  return {
    views, viewValue, setViewValue,
  };
}

export const useDataProps = (): DataProps => {
  const [tvShows, setTvShows] = useState<ShowData[]>([] as ShowData[]);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortCol, setSortCol] = useState('');

  return {
    tvShows, setTvShows, sortOrder, setSortOrder, sortCol, setSortCol 
  };
}