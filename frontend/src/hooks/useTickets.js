import { useState, useEffect, useCallback } from 'react';
import { getTickets, getDashboardStats } from '../services/officerApi';

export function useTickets(initialFilters = {}) {
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(initialFilters);

  const fetchTickets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [ticketsRes, statsRes] = await Promise.all([
        getTickets(filters),
        getDashboardStats(),
      ]);
      setTickets(ticketsRes.data || []);
      setStats(statsRes.data || null);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  return { tickets, stats, loading, error, filters, setFilters, refetch: fetchTickets };
}
