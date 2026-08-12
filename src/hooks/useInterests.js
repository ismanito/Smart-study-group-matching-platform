import { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';

const api = axios.create({ baseURL: '/api/interests' });

/**
 * Shared interest catalog + selection logic for the web app.
 */
export default function useInterests() {
  const { token } = useAuth();
  const [allInterests, setAllInterests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState('');

  const authConfig = useMemo(
    () => ({ headers: token ? { Authorization: `Bearer ${token}` } : {} }),
    [token]
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const [allRes, mineRes] = await Promise.all([
        api.get('/all'),
        api.get('/my-interests', authConfig),
      ]);
      setAllInterests(Array.isArray(allRes.data) ? allRes.data : []);
      setSelected(Array.isArray(mineRes.data) ? mineRes.data : []);
    } catch (err) {
      const message =
        err.response?.status === 401
          ? 'Your session expired. Please log out and log in again.'
          : err.response?.data?.message || err.message || 'Unable to load interests.';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [authConfig]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedIds = useMemo(
    () => new Set(selected.map((item) => String(item.id))),
    [selected]
  );

  const available = useMemo(
    () => allInterests.filter((item) => !selectedIds.has(String(item.id))),
    [allInterests, selectedIds]
  );

  const addInterest = async (interest) => {
    setBusyId(interest.id);
    setError('');
    setSelected((prev) =>
      prev.some((item) => String(item.id) === String(interest.id)) ? prev : [...prev, interest]
    );
    try {
      await api.post('/add', { interestId: interest.id }, authConfig);
    } catch (err) {
      setSelected((prev) => prev.filter((item) => String(item.id) !== String(interest.id)));
      setError(err.response?.data?.message || err.message || 'Unable to add interest.');
    } finally {
      setBusyId(null);
    }
  };

  const removeInterest = async (interest) => {
    setBusyId(interest.id);
    setError('');
    setSelected((prev) => prev.filter((item) => String(item.id) !== String(interest.id)));
    try {
      await api.delete(`/remove/${interest.id}`, authConfig);
    } catch (err) {
      setSelected((prev) => [...prev, interest]);
      setError(err.response?.data?.message || err.message || 'Unable to remove interest.');
    } finally {
      setBusyId(null);
    }
  };

  const clearAll = async () => {
    if (!selected.length) return;
    setError('');
    const previous = [...selected];
    setSelected([]);
    try {
      await Promise.all(
        previous.map((interest) => api.delete(`/remove/${interest.id}`, authConfig))
      );
    } catch (err) {
      setSelected(previous);
      setError(err.response?.data?.message || err.message || 'Unable to clear interests.');
    }
  };

  return {
    allInterests,
    selected,
    available,
    loading,
    busyId,
    error,
    setError,
    load,
    addInterest,
    removeInterest,
    clearAll,
  };
}
