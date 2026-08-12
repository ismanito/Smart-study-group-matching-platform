import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

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
 * Mobile match card — View Profile only.
 */
export default function MatchCard({ user, onViewProfile }) {
  const shared = Array.isArray(user.sharedInterests) ? user.sharedInterests : [];

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {user.profilePicture ? (
          <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.initials}>{initials(user.name)}</Text>
          </View>
        )}
        <View style={styles.meta}>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.count}>
            {user.sharedCount} shared interest{user.sharedCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      {shared.length > 0 && (
        <View style={styles.tags}>
          {shared.map((interest) => (
            <View key={String(interest.id)} style={styles.tag}>
              <Text style={styles.tagText}>
                {interest.icon ? `${interest.icon} ` : ''}
                {interest.name}
              </Text>
            </View>
          ))}
        </View>
      )}

      <Pressable
        onPress={() => onViewProfile?.(user)}
        accessibilityRole="button"
        accessibilityLabel={`View profile for ${user.name}`}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>View Profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarFallback: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 16,
  },
  meta: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.navy,
  },
  count: {
    marginTop: 2,
    fontSize: 13,
    color: COLORS.textLight,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  tag: {
    backgroundColor: COLORS.chipBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.text,
  },
  button: {
    marginTop: 14,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPressed: {
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: COLORS.navy,
    fontWeight: '700',
    fontSize: 15,
  },
});
