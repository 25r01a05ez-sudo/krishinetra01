import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context/AppContext';
import { getHistory } from '../services/api';

/**
 * Combines scans saved on this device with (optional) server history.
 * Server history is only requested in live mode, and a missing route is handled calmly.
 * serverState: 'idle' | 'loading' | 'ok' | 'unavailable' | 'error'
 */
export function useScans({ fetchServer = true } = {}) {
  const { history, demoMode } = useApp();
  const [serverScans, setServerScans] = useState([]);
  const [serverState, setServerState] = useState('idle');
  const [serverError, setServerError] = useState(null);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    if (demoMode || !fetchServer) {
      setServerScans([]);
      setServerState('idle');
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setServerState('loading');
    setServerError(null);
    try {
      const items = await getHistory({ signal: ctrl.signal });
      setServerScans(items);
      setServerState('ok');
    } catch (err) {
      if (err.kind === 'aborted') return;
      setServerScans([]);
      if (err.kind === 'not_available') setServerState('unavailable');
      else {
        setServerError(err);
        setServerState('error');
      }
    }
  }, [demoMode, fetchServer]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  const scans = useMemo(() => {
    const localPredictionIds = new Set(history.map((s) => s.predictionId).filter((v) => v !== null && v !== undefined));
    const extra = serverScans.filter((s) => s.predictionId === null || !localPredictionIds.has(s.predictionId));
    return [...history, ...extra].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
  }, [history, serverScans]);

  return { scans, serverState, serverError, reload: load, localCount: history.length };
}
