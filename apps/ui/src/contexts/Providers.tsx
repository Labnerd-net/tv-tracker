import { AlertContext, TvShowContext, ViewContext } from './Contexts.ts';
import type { DataProps } from '../types/data';
import type { AlertProps } from '../types/alert';
import type { ViewProps } from '../types/view.ts';

export function MyProviders({ children, alertProps, dataProps, viewProps } : {children: React.ReactNode, alertProps: AlertProps, dataProps: DataProps, viewProps: ViewProps}) {
  return (
    <AlertContext value={alertProps}>
      <TvShowContext value={dataProps}>
        <ViewContext value={viewProps}>
          {children}
        </ViewContext>
      </TvShowContext>
    </AlertContext>
  );
}
