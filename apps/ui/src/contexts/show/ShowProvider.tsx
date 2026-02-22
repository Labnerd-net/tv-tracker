import { type ReactNode, useState } from 'react';
import { ShowContext } from './ShowContext';
import type { ShowData } from '@shared/types/tv-tracker';

export function ShowProvider({ children }: { children: ReactNode }) {
  const [tvShows, setTvShows] = useState<ShowData[]>([] as ShowData[]);

  return (
    <ShowContext.Provider value={{ tvShows, setTvShows }}>
      {children}
    </ShowContext.Provider>
  );
}
