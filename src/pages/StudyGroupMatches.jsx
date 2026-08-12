import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import UserCard from '../components/UserCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import styles from './StudyGroupMatches.module.css';

export default function StudyGroupMatches() {
  const { token } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterInterestId, setFilterInterestId] = useState('all');

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await axios.get('/api/interests/find-matches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load matches.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const filterOptions = useMemo(() => {
    const map = new Map();
    matches.forEach((match) => {
      (match.sharedInterests || []).forEach((interest) => {
        map.set(String(interest.id), interest);
      });
    });
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [matches]);

  const filtered = useMemo(() => {
    if (filterInterestId === 'all') return matches;
    return matches.filter((match) =>
      (match.sharedInterests || []).some(
        (interest) => String(interest.id) === String(filterInterestId)
      )
    );
  }, [matches, filterInterestId]);

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loading}>
          <div className={styles.spinner} aria-hidden="true" />
          <p>Finding classmates with shared interests…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>StudyMatch</p>
          <h1 className={styles.title}>Study Group Matches</h1>
          <p className={styles.lead}>
            Classmates sorted by how many subjects you share. Open a classmate card to learn more.
          </p>
        </div>
        <Link to="/match" className={styles.backLink}>
          ← Find Peers
        </Link>
      </header>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      {matches.length > 0 && (
        <div className={styles.toolbar}>
          <label htmlFor="interest-filter" className={styles.filterLabel}>
            Filter by interest
          </label>
          <select
            id="interest-filter"
            className={styles.select}
            value={filterInterestId}
            onChange={(event) => setFilterInterestId(event.target.value)}
          >
            <option value="all">All shared interests</option>
            {filterOptions.map((interest) => (
              <option key={interest.id} value={interest.id}>
                {interest.icon ? `${interest.icon} ` : ''}
                {interest.name}
              </option>
            ))}
          </select>
          <p className={styles.countHint}>
            Showing {filtered.length} of {matches.length} match{matches.length === 1 ? '' : 'es'}
          </p>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className={styles.empty}>
          <h2>No matches yet</h2>
          <p>
            {matches.length === 0
              ? 'Check back when more students join StudyMatch, or enroll in more courses.'
              : 'No matches for that filter. Try another interest.'}
          </p>
          <Link to="/match" className={styles.secondaryBtn}>
            Go to Find Peers
          </Link>
        </div>
      ) : (
        <div className={styles.list}>
          {filtered.map((user) => (
            <UserCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
