import { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getGuidance } from '../services/api';
import { demoGuidance } from '../services/demo';
import { findDisease, diseaseToGuidance } from '../data/diseases';

const cache = new Map(); // live-mode cache: disease -> guidance|null

/**
 * Loads guidance for a disease label.
 * Priority:
 *   1. Backend API (live mode)
 *   2. Local disease reference database (20 entries)
 *   3. Demo guidance (demo mode)
 *
 * state: 'idle' | 'loading' | 'ready' | 'missing' | 'error'
 */
export function useGuidance(disease, { enabled = true } = {}) {
  const { demoMode } = useApp();
  const [state, setState] = useState({ status: 'idle', data: null, error: null });

  useEffect(() => {
    if (!enabled || !disease) {
      setState({ status: 'idle', data: null, error: null });
      return undefined;
    }
    if (!demoMode && cache.has(disease)) {
      const data = cache.get(disease);
      setState({ status: data ? 'ready' : 'missing', data, error: null });
      return undefined;
    }
    const ctrl = new AbortController();
    setState({ status: 'loading', data: null, error: null });

    const resolve = async () => {
      if (demoMode) {
        // In demo mode, try local DB first, then demo fallback
        const localEntry = findDisease(disease);
        if (localEntry) return diseaseToGuidance(localEntry);
        return demoGuidance(disease);
      }
      // Live mode: try backend first
      try {
        const backendData = await getGuidance(disease, { signal: ctrl.signal });
        if (backendData) return backendData;
      } catch (err) {
        // If it's not an abort, try local fallback before throwing
        if (err?.kind === 'aborted') throw err;
        // Backend unreachable — fall through to local DB
      }
      // Fallback: search local disease reference database
      const localEntry = findDisease(disease);
      if (localEntry) return diseaseToGuidance(localEntry);
      return null;
    };

    resolve()
      .then((data) => {
        if (!demoMode) cache.set(disease, data);
        setState({ status: data ? 'ready' : 'missing', data, error: null });
      })
      .catch((error) => {
        if (error.kind === 'aborted') return;
        setState({ status: 'error', data: null, error });
      });
    return () => ctrl.abort();
  }, [disease, enabled, demoMode]);

  return state;
}
