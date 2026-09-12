import { useState, useEffect, useCallback } from 'react';
import { getMapReports, getMapOutbreaks } from '../services/officerApi';

export function useMapReports(filters = {}) {
  const [reports, setReports] = useState([]);
  const [outbreaks, setOutbreaks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [rRes, oRes] = await Promise.all([
        getMapReports(filters),
        getMapOutbreaks(),
      ]);
      setReports(rRes.data || []);
      setOutbreaks(oRes.data || []);
    } catch (err) {
      setError(err.message || 'Failed to load map data');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { reports, outbreaks, loading, error, refetch: fetchData };
}
