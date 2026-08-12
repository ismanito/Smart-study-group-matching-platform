import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import InterestCard from '../components/InterestCard.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { STUDY_METHOD_OPTIONS } from '../data/studyPrefs.js';
import useInterests from '../hooks/useInterests.js';
import styles from './InterestSelection.module.css';

export default function InterestSelection() {
  const navigate = useNavigate();
  const { user, token, login } = useAuth();
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
  const [studyMethods, setStudyMethods] = useState([]);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState('');

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

  const toggleMethod = (method) => {
    setStudyMethods((current) =>
      current.includes(method)
        ? current.filter((item) => item !== method)
        : [...current, method].slice(0, 6)
    );
  };

  const canContinue = selected.length > 0 && studyMethods.length > 0;

  const handleContinue = async () => {
    if (!canContinue || finishing) return;
    setFinishing(true);
    setFinishError('');
    try {
      const response = await fetch('/api/interests/complete-onboarding', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studyMethods }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload.message || 'Unable to finish setup.');
      }
      if (payload.token) {
        login(payload.token);
      }
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setFinishError(err.message || 'Unable to finish setup.');
    } finally {
      setFinishing(false);
    }
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
          <p className={styles.step}>One-time setup: interests & study methods</p>
        </div>
      </header>

      <p className={styles.lead}>
        Choose what you study and how you like to learn. You’ll only do this once — matching uses these choices
        automatically.
      </p>

      {(error || finishError) && (
        <div className={styles.error} role="alert">
          {finishError || error}
        </div>
      )}

      <section className={styles.section} aria-labelledby="available-heading">
        <h2 id="available-heading" className={styles.sectionTitle}>
          Study interests
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
            Your selected interests
          </h2>
          {selected.length > 0 && (
            <button type="button" className={styles.clearBtn} onClick={clearAll}>
              Clear All
            </button>
          )}
        </div>

        {selected.length === 0 ? (
          <div className={styles.empty}>Pick at least one subject.</div>
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

      <section className={styles.section} aria-labelledby="methods-heading">
        <h2 id="methods-heading" className={styles.sectionTitle}>
          How do you like to study?
        </h2>
        <p className={styles.lead}>Pick one or more methods that fit you best.</p>
        <div className={styles.methodGrid} role="list">
          {STUDY_METHOD_OPTIONS.map((method) => {
            const active = studyMethods.includes(method);
            return (
              <button
                key={method}
                type="button"
                role="listitem"
                onClick={() => toggleMethod(method)}
                className={`${styles.methodChip} ${active ? styles.methodChipActive : ''}`}
              >
                {method}
              </button>
            );
          })}
        </div>
        {studyMethods.length === 0 && (
          <div className={styles.empty}>Pick at least one study method to continue.</div>
        )}
      </section>

      {canContinue && (
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleContinue}
            disabled={finishing}
          >
            {finishing ? 'Saving…' : 'Continue to StudyMatch'}
          </button>
        </div>
      )}
    </div>
  );
}
