import { AuthContext, AlertContext, TvShowContext, ViewContext } from './Contexts.ts';
import type { AuthProps } from '../types/auth.ts';
import type { DataProps } from '../types/data';
import type { AlertProps } from '../types/alert';
import type { ViewProps } from '../types/view.ts';

export function MyProviders({ children, authProps, alertProps, dataProps, viewProps } : {children: React.ReactNode, authProps: AuthProps, alertProps: AlertProps, dataProps: DataProps, viewProps: ViewProps}) {
  return (
    <AuthContext value={authProps}>
      <AlertContext value={alertProps}>
        <TvShowContext value={dataProps}>
          <ViewContext value={viewProps}>
            {children}
          </ViewContext>
        </TvShowContext>
      </AlertContext>
    </AuthContext>
  );
}
