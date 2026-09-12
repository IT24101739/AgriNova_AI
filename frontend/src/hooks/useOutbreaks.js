import { useState, useEffect, useCallback } from 'react';
import { getOutbreakCandidates, getConfirmedOutbreaks, confirmOutbreak, rejectOutbreak } from '../services/officerApi';

export function useOutbreaks() {
  const [candidates, setCandidates] = useState([]);
  const [confirmed, setConfirmed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [cRes, cfRes] = await Promise.all([
        getOutbreakCandidates(),
        getConfirmedOutbreaks(),
      ]);
      setCandidates(cRes.data || []);
      setConfirmed(cfRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load outbreaks');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleConfirm = async (id, body = {}) => {
    await confirmOutbreak(id, body);
    fetchAll();
  };

  const handleReject = async (id, reason = '') => {
    await rejectOutbreak(id, { reason });
    fetchAll();
  };

  return { candidates, confirmed, loading, error, refetch: fetchAll, handleConfirm, handleReject };
}
