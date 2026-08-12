import { useState } from 'react';
import { Link } from 'react-router-dom';
import InterestCard from '../components/InterestCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import useInterests from '../hooks/useInterests.js';
import styles from './InterestSelection.module.css';

export default function InterestSelection() {
  const { user } = useAuth();
  const {
    selected,
    available,
    loading,
    busyId,
    error,
    addInterest,
    removeInterest,
    clearAll,
  } = useInterests();
  const [exitingId, setExitingId] = useState(null);

  const handleSelect = async (interest) => {
    setExitingId(interest.id);
    window.setTimeout(() => {
      addInterest(interest).finally(() => setExitingId(null));
    }, 220);
  };

  const handleRemove = async (interest) => {
    setExitingId(interest.id);
    window.setTimeout(() => {
      removeInterest(interest).finally(() => setExitingId(null));
    }, 220);
  };

  if (loading) {
    return (
      <div className={styles.page} aria-busy="true">
        <div className={styles.skeletonHeader} />
        <div className={styles.skeletonGrid}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={styles.skeletonCard} />
          ))}
        </div>
        <p className={styles.srOnly}>Loading interests…</p>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <p className={styles.brand}>StudyMatch</p>
          <h1 className={styles.title}>Welcome, {user?.name || 'Student'}!</h1>
          <p className={styles.step}>Step 1: Choose Your Interests</p>
        </div>
        <Link to="/dashboard" className={styles.backLink}>
          ← Dashboard
        </Link>
      </header>

      <p className={styles.lead}>
        Tap a subject to add it. We’ll match you with classmates studying the same topics.
      </p>

      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}

      <section className={styles.section} aria-labelledby="available-heading">
        <h2 id="available-heading" className={styles.sectionTitle}>
          Available Interests
        </h2>
        {available.length === 0 ? (
          <div className={styles.empty}>You’ve selected every interest. Nice coverage!</div>
        ) : (
          <div className={styles.grid} role="list">
            {available.map((interest) => (
              <div key={interest.id} role="listitem">
                <InterestCard
                  interest={interest}
                  mode="available"
                  disabled={busyId === interest.id}
                  exiting={exitingId === interest.id}
                  onSelect={handleSelect}
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.section} aria-labelledby="selected-heading">
        <div className={styles.sectionRow}>
          <h2 id="selected-heading" className={styles.sectionTitle}>
            Your Selected Interests
          </h2>
          {selected.length > 0 && (
            <button type="button" className={styles.clearBtn} onClick={clearAll}>
              Clear All
            </button>
          )}
        </div>

        {selected.length === 0 ? (
          <div className={styles.empty}>
            No interests selected yet. Pick at least one subject to find study groups.
          </div>
        ) : (
          <div className={styles.selectedGrid} role="list">
            {selected.map((interest) => (
              <InterestCard
                key={interest.id}
                interest={interest}
                mode="selected"
                disabled={busyId === interest.id}
                exiting={exitingId === interest.id}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </section>

      {selected.length > 0 && (
        <div className={styles.actions}>
          <Link to="/study-matches" className={styles.primaryBtn}>
            Find Study Groups
          </Link>
        </div>
      )}
    </div>
  );
}
