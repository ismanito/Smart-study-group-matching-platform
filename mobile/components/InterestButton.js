import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { COLORS } from '../theme';

/**
 * Mobile interest button — available or selected mode.
 */
export default function InterestButton({
  interest,
  selected = false,
  disabled = false,
  onPress,
  onRemove,
}) {
  if (selected) {
    return (
      <View style={styles.selected}>
        <Text style={styles.selectedText}>
          {interest.icon ? `${interest.icon} ` : ''}
          {interest.name}
        </Text>
        <Pressable
          onPress={() => onRemove?.(interest)}
          disabled={disabled}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${interest.name}`}
          style={({ pressed }) => [
            styles.removeBtn,
            pressed && styles.removePressed,
            disabled && styles.disabled,
          ]}
        >
          <Text style={styles.removeText}>×</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Pressable
      onPress={() => onPress?.(interest)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`Select ${interest.name}`}
      style={({ pressed }) => [
        styles.available,
        pressed && styles.availablePressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={styles.icon}>{interest.icon || '📘'}</Text>
      <Text style={styles.name}>{interest.name}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  available: {
    width: '31%',
    minHeight: 100,
    marginBottom: 12,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  availablePressed: {
    transform: [{ scale: 0.97 }],
    opacity: 0.92,
  },
  icon: {
    fontSize: 26,
    marginBottom: 6,
  },
  name: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  selected: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 52,
    marginBottom: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: COLORS.navy,
  },
  selectedText: {
    flex: 1,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '600',
    marginRight: 8,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePressed: {
    backgroundColor: COLORS.yellow,
  },
  removeText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 22,
  },
  disabled: {
    opacity: 0.5,
  },
});
