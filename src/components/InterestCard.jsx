import styles from './InterestCard.module.css';

/**
 * Clickable interest card for available / selected lists.
 */
export default function InterestCard({
  interest,
  mode = 'available',
  disabled = false,
  onSelect,
  onRemove,
  exiting = false,
}) {
  const label = `${interest.icon ? `${interest.icon} ` : ''}${interest.name}`;

  if (mode === 'selected') {
    return (
      <div
        className={`${styles.selectedCard} ${exiting ? styles.fadeOut : ''}`}
        role="listitem"
      >
        <span className={styles.label}>{label}</span>
        <button
          type="button"
          className={styles.removeBtn}
          onClick={() => onRemove?.(interest)}
          disabled={disabled}
          aria-label={`Remove ${interest.name}`}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      className={`${styles.availableCard} ${exiting ? styles.fadeOut : ''}`}
      onClick={() => onSelect?.(interest)}
      disabled={disabled}
      aria-label={`Select ${interest.name}`}
    >
      <span className={styles.icon} aria-hidden="true">
        {interest.icon || '📘'}
      </span>
      <span className={styles.name}>{interest.name}</span>
    </button>
  );
}
