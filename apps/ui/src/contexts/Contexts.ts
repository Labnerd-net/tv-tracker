import { createContext } from 'react';
import type { DataProps } from '../types/data';
import type { AlertProps } from '../types/alert';
import type { ViewProps } from '../types/view.ts';

export const TvShowContext = createContext<DataProps>({} as DataProps);
export const AlertContext = createContext<AlertProps>({} as AlertProps);
export const ViewContext = createContext<ViewProps>({} as ViewProps);
