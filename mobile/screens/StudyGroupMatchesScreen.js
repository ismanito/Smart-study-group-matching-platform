import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import axios from 'axios';

const COLORS = {
  navy: '#1a3a52',
  yellow: '#f5c518',
  white: '#ffffff',
  grayBorder: '#c5cdd5',
  grayText: '#6b7c8a',
  background: '#f4f7fa',
  danger: '#c0392b',
  chipBg: '#e8eef3',
};

/**
 * StudyGroupMatchesScreen
 *
 * Lists users who share interests with the current user.
 * Only navigates to a profile screen — no message / connection-request input.
 *
 * Props:
 *  - navigation
 *  - route (optional; reads apiBaseUrl / token from params)
 *  - apiBaseUrl
 *  - token
 *  - profileRouteName (default 'Profile')
 */
export default function StudyGroupMatchesScreen({
  navigation,
  route,
  apiBaseUrl: apiBaseUrlProp,
  token: tokenProp,
  profileRouteName = 'Profile',
}) {
  const apiBaseUrl =
    apiBaseUrlProp || route?.params?.apiBaseUrl || 'http://localhost:5000';
  const token = tokenProp || route?.params?.token;

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const client = useMemo(
    () =>
      axios.create({
        baseURL: `${String(apiBaseUrl).replace(/\/$/, '')}/api/interests`,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [apiBaseUrl, token]
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const { data } = await client.get('/find-matches');
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load matches.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [client]);

  useEffect(() => {
    load();
  }, [load]);

  const viewProfile = (user) => {
    navigation.navigate(profileRouteName, {
      userId: user.id,
      user,
    });
  };

  const initials = (name = '') =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || '?';

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        {item.profilePicture ? (
          <Image source={{ uri: item.profilePicture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitials}>{initials(item.name)}</Text>
          </View>
        )}

        <View style={styles.meta}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.sharedCount}>
            {item.sharedCount} shared interest{item.sharedCount === 1 ? '' : 's'}
          </Text>
        </View>
      </View>

      <View style={styles.tags}>
        {(item.sharedInterests || []).map((interest) => (
          <View key={interest.id || interest.name} style={styles.tag}>
            <Text style={styles.tagText}>
              {interest.icon ? `${interest.icon} ` : ''}
              {interest.name}
            </Text>
          </View>
        ))}
      </View>

      <Pressable style={styles.viewBtn} onPress={() => viewProfile(item)}>
        <Text style={styles.viewBtnText}>View Profile</Text>
      </Pressable>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={styles.muted}>Finding study matches…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={matches}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.title}>Study Group Matches</Text>
            <Text style={styles.subtitle}>
              People who share your interests, ranked by overlap.
            </Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.muted}>
              Add more interests or check back when more students join.
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              load();
            }}
            tintColor={COLORS.navy}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.grayText,
    lineHeight: 22,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarFallback: {
    backgroundColor: COLORS.navy,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 18,
  },
  meta: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  sharedCount: {
    marginTop: 4,
    color: COLORS.grayText,
    fontSize: 13,
    fontWeight: '600',
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: COLORS.chipBg,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  tagText: {
    color: COLORS.navy,
    fontSize: 12,
    fontWeight: '600',
  },
  viewBtn: {
    backgroundColor: COLORS.navy,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewBtnText: {
    color: COLORS.yellow,
    fontWeight: '800',
    fontSize: 15,
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
  muted: {
    color: COLORS.grayText,
    fontSize: 14,
    textAlign: 'center',
  },
  error: {
    color: COLORS.danger,
    marginTop: 10,
    fontSize: 14,
  },
});
