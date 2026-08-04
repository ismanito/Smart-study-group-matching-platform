import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
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
};

/**
 * InterestSelectionScreen
 *
 * Props:
 *  - navigation (React Navigation)
 *  - apiBaseUrl (string) e.g. 'http://localhost:5000'
 *  - token (JWT string)
 *  - getAuthHeader optional () => ({ Authorization: `Bearer ${token}` })
 */
export default function InterestSelectionScreen({
  navigation,
  apiBaseUrl = 'http://localhost:5000',
  token,
  getAuthHeader,
}) {
  const [allInterests, setAllInterests] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const authHeaders = useMemo(() => {
    if (typeof getAuthHeader === 'function') return getAuthHeader();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }, [getAuthHeader, token]);

  const client = useMemo(
    () =>
      axios.create({
        baseURL: `${apiBaseUrl.replace(/\/$/, '')}/api/interests`,
        headers: authHeaders,
      }),
    [apiBaseUrl, authHeaders]
  );

  const load = useCallback(async () => {
    setError('');
    try {
      const [allRes, mineRes] = await Promise.all([
        axios.get(`${apiBaseUrl.replace(/\/$/, '')}/api/interests/all`),
        client.get('/my-interests'),
      ]);
      setAllInterests(Array.isArray(allRes.data) ? allRes.data : []);
      setSelected(Array.isArray(mineRes.data) ? mineRes.data : []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to load interests.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [apiBaseUrl, client]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedIds = useMemo(
    () => new Set(selected.map((item) => item.id)),
    [selected]
  );

  const available = useMemo(
    () => allInterests.filter((item) => !selectedIds.has(item.id)),
    [allInterests, selectedIds]
  );

  const addInterest = async (interest) => {
    setBusyId(interest.id);
    setError('');
    // Optimistic UI: disappear from available immediately
    setSelected((prev) =>
      prev.some((item) => item.id === interest.id) ? prev : [...prev, interest]
    );
    try {
      await client.post('/add', { interestId: interest.id });
    } catch (err) {
      setSelected((prev) => prev.filter((item) => item.id !== interest.id));
      Alert.alert('Could not add', err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const removeInterest = async (interest) => {
    setBusyId(interest.id);
    setError('');
    setSelected((prev) => prev.filter((item) => item.id !== interest.id));
    try {
      await client.delete(`/remove/${interest.id}`);
    } catch (err) {
      setSelected((prev) => [...prev, interest]);
      Alert.alert('Could not remove', err.response?.data?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const goToMatches = () => {
    navigation.navigate('StudyGroupMatches', {
      apiBaseUrl,
      token,
    });
  };

  if (loading) {
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
      <Text style={styles.title}>Your Interests</Text>
      <Text style={styles.subtitle}>
        Tap subjects you want to study. Selected ones move to your list.
      </Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Text style={styles.sectionTitle}>Your Selected Interests</Text>
      {selected.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.muted}>No interests selected yet.</Text>
        </View>
      ) : (
        <View style={styles.selectedWrap}>
          {selected.map((interest) => (
            <View key={interest.id} style={styles.selectedCard}>
              <Text style={styles.selectedText}>
                {interest.icon ? `${interest.icon} ` : ''}
                {interest.name}
              </Text>
              <Pressable
                onPress={() => removeInterest(interest)}
                disabled={busyId === interest.id}
                style={styles.removeBtn}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${interest.name}`}
              >
                <Text style={styles.removeBtnText}>×</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.sectionTitle}>Available Interests</Text>
      {available.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.muted}>You’ve selected every interest.</Text>
        </View>
      ) : (
        <View style={styles.grid}>
          {available.map((interest) => (
            <Pressable
              key={interest.id}
              onPress={() => addInterest(interest)}
              disabled={busyId === interest.id}
              style={({ pressed }) => [
                styles.availableChip,
                pressed && styles.availableChipPressed,
                busyId === interest.id && styles.chipBusy,
              ]}
            >
              <Text style={styles.availableText}>
                {interest.icon ? `${interest.icon} ` : ''}
                {interest.name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {selected.length > 0 ? (
        <Pressable style={styles.cta} onPress={goToMatches}>
          <Text style={styles.ctaText}>Find Study Groups</Text>
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.navy,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.grayText,
    marginBottom: 20,
    lineHeight: 22,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.navy,
    marginTop: 12,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  availableChip: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    minWidth: '46%',
    flexGrow: 1,
  },
  availableChipPressed: {
    opacity: 0.75,
  },
  availableText: {
    color: COLORS.navy,
    fontWeight: '600',
    fontSize: 14,
    textAlign: 'center',
  },
  selectedWrap: {
    gap: 10,
  },
  selectedCard: {
    backgroundColor: COLORS.navy,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectedText: {
    color: COLORS.white,
    fontWeight: '600',
    fontSize: 15,
    flex: 1,
    paddingRight: 10,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtnText: {
    color: COLORS.navy,
    fontSize: 22,
    fontWeight: '700',
    lineHeight: 24,
    marginTop: -2,
  },
  emptyBox: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.grayBorder,
    padding: 18,
    marginBottom: 4,
  },
  muted: {
    color: COLORS.grayText,
    fontSize: 14,
    textAlign: 'center',
  },
  error: {
    color: COLORS.danger,
    marginBottom: 12,
    fontSize: 14,
  },
  chipBusy: {
    opacity: 0.5,
  },
  cta: {
    marginTop: 28,
    backgroundColor: COLORS.yellow,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: COLORS.navy,
    fontWeight: '800',
    fontSize: 16,
  },
});
