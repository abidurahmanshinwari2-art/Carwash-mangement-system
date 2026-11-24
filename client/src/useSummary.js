import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export function useSummary(from, to) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const query = new URLSearchParams();
      if (from) query.set('from', from);
      if (to) query.set('to', to);
      setData(await api(`/api/summary?${query.toString()}`));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, error, loading, reload };
}
