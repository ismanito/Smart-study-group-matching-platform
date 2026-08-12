import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import axios from 'axios';
import MatchCard from '../components/MatchCard';
import { COLORS, SPACING } from '../theme';

/**
 * StudyGroupMatchesScreen — shared-interest matches (View Profile only).
 */
export default function StudyGroupMatchesScreen({
  navigation,
  route,
  apiBaseUrl: apiBaseUrlProp,
  token: tokenProp,
  profileRouteName = 'PeerProfile',
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
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <Text style={styles.back}>← Interests</Text>
        </Pressable>
        <Text style={styles.title}>Study Group Matches</Text>
        <Text style={styles.lead}>Sorted by shared interest count.</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <FlatList
        data={matches}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
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
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No matches yet</Text>
            <Text style={styles.muted}>
              Add more interests or check back when more students join.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <MatchCard user={item} onViewProfile={viewProfile} />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  back: {
    color: COLORS.navy,
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
  },
  lead: {
    marginTop: 4,
    color: COLORS.textLight,
    fontSize: 14,
  },
  list: {
    padding: SPACING.lg,
    paddingTop: SPACING.sm,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  muted: {
    color: COLORS.textLight,
    textAlign: 'center',
  },
  error: {
    marginHorizontal: SPACING.lg,
    marginBottom: 8,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fdecea',
    color: COLORS.danger,
  },
  empty: {
    padding: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 8,
  },
});
