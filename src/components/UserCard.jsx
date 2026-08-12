import { Link } from 'react-router-dom';
import styles from './UserCard.module.css';

function initials(name = '') {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || '?'
  );
}

/**
 * Match result card — View Profile only (no messaging).
 */
export default function UserCard({ user, profilePath }) {
  const shared = Array.isArray(user.sharedInterests) ? user.sharedInterests : [];
  const to = profilePath || `/peers/${user.id}`;

  return (
    <article className={styles.card} aria-label={`${user.name} match card`}>
      <div className={styles.top}>
        {user.profilePicture ? (
          <img
            src={user.profilePicture}
            alt=""
            className={styles.avatarImg}
          />
        ) : (
          <div className={styles.avatar} aria-hidden="true">
            {initials(user.name)}
          </div>
        )}
        <div className={styles.meta}>
          <h3 className={styles.name}>{user.name}</h3>
          <p className={styles.count}>
            {user.sharedCount} shared interest{user.sharedCount === 1 ? '' : 's'}
          </p>
        </div>
        <Link to={to} className={styles.profileBtn}>
          View Profile
        </Link>
      </div>

      {shared.length > 0 && (
        <ul className={styles.tags} aria-label="Shared interests">
          {shared.map((interest) => (
            <li key={interest.id} className={styles.tag}>
              {interest.icon ? `${interest.icon} ` : ''}
              {interest.name}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
