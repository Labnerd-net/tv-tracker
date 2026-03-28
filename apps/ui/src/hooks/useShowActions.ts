import { useShow } from '../contexts/show/ShowContext.js';

export function useShowActions() {
  const { actionLoading, refreshShow, deleteShow } = useShow();
  return { actionLoading, refreshShow, deleteShow };
}
