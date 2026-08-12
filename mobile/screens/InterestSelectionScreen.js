import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import InterestButton from '../components/InterestButton';
import { COLORS, SPACING } from '../theme';

const CACHE_KEY = 'studymatch.interests.cache';

/**
 * InterestSelectionScreen — mobile interest picker with pull-to-refresh + cache.
 *
 * Props:
 *  - navigation
 *  - apiBaseUrl (default http://localhost:5000)
 *  - token (JWT)
 *  - userName (optional greeting)
 */
export default function InterestSelectionScreen({
  navigation,
  apiBaseUrl = 'http://localhost:5000',
  token,
  userName,
}) {
  const [allInterests, setAllInterests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const base = String(apiBaseUrl).replace(/\/$/, '');
  const client = useMemo(
    () =>
      axios.create({
        baseURL: `${base}/api/interests`,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }),
    [base, token]
  );

  const persistCache = async (all, mine) => {
    try {
      await AsyncStorage.setItem(
        CACHE_KEY,
        JSON.stringify({ all, mine, savedAt: Date.now() })
      );
    } catch (_err) {
      // Cache is best-effort only.
    }
  };

  const loadCache = async () => {
    try {
      const raw = await AsyncStorage.getItem(CACHE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.all)) setAllInterests(parsed.all);
      if (Array.isArray(parsed.mine)) setSelected(parsed.mine);
    } catch (_err) {
      // Ignore bad cache.
    }
  };

  const load = useCallback(async () => {
    setError('');
    try {
      const [allRes, mineRes] = await Promise.all([
        axios.get(`${base}/api/interests/all`),
        client.get('/my-interests'),
      ]);
      const all = Array.isArray(allRes.data) ? allRes.data : [];
      const mine = Array.isArray(mineRes.data) ? mineRes.data : [];
      setAllInterests(all);
      setSelected(mine);
      await persistCache(all, mine);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load interests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [base, client]);

  useEffect(() => {
    loadCache().finally(load);
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
      await client.post('/add', { interestId: interest.id });
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
      await client.delete(`/remove/${interest.id}`);
    } catch (err) {
      setSelected((prev) => [...prev, interest]);
      setError(err.response?.data?.message || err.message || 'Unable to remove interest.');
    } finally {
      setBusyId(null);
    }
  };

  const clearAll = async () => {
    const previous = [...selected];
    setSelected([]);
    setError('');
    try {
      await Promise.all(previous.map((interest) => client.delete(`/remove/${interest.id}`)));
    } catch (err) {
      setSelected(previous);
      setError(err.response?.data?.message || err.message || 'Unable to clear interests.');
    }
  };

  if (loading && !allInterests.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={COLORS.navy} />
        <Text style={styles.muted}>Loading interests…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
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
    >
      <Text style={styles.brand}>StudyMatch</Text>
      <Text style={styles.title}>Welcome, {userName || 'Student'}!</Text>
      <Text style={styles.step}>Step 1: Choose Your Interests</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Available</Text>
      <View style={styles.grid}>
        {available.map((interest) => (
          <InterestButton
            key={String(interest.id)}
            interest={interest}
            disabled={busyId === interest.id}
            onPress={addInterest}
          />
        ))}
      </View>
      {available.length === 0 ? (
        <Text style={styles.muted}>You’ve selected every interest.</Text>
      ) : null}

      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>Selected</Text>
        {selected.length > 0 ? (
          <Pressable onPress={clearAll} hitSlop={8}>
            <Text style={styles.clear}>Clear All</Text>
          </Pressable>
        ) : null}
      </View>

      {selected.length === 0 ? (
        <Text style={styles.empty}>No interests selected yet. Pick at least one subject.</Text>
      ) : (
        selected.map((interest) => (
          <InterestButton
            key={String(interest.id)}
            interest={interest}
            selected
            disabled={busyId === interest.id}
            onRemove={removeInterest}
          />
        ))
      )}

      {selected.length > 0 ? (
        <Pressable
          style={styles.primaryBtn}
          onPress={() =>
            navigation.navigate('StudyGroupMatches', { apiBaseUrl, token })
          }
        >
          <Text style={styles.primaryText}>Find Study Groups</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: 40,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    gap: 12,
  },
  brand: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: COLORS.navy,
  },
  title: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.navy,
  },
  step: {
    marginTop: 6,
    marginBottom: 16,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  sectionTitle: {
    marginTop: 8,
    marginBottom: 12,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  rowBetween: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  clear: {
    color: COLORS.textLight,
    fontWeight: '600',
  },
  empty: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    color: COLORS.textLight,
    marginBottom: 12,
  },
  muted: {
    color: COLORS.textLight,
    marginBottom: 12,
  },
  error: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fdecea',
    color: COLORS.danger,
  },
  primaryBtn: {
    marginTop: 20,
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: COLORS.navy,
    fontWeight: '700',
    fontSize: 16,
  },
});
