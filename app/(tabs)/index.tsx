// app/(tabs)/index.tsx
import { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Text, View } from '@/components/Themed';
import {
  collection,
  query,
  orderBy,
  limit as limitQuery,
  onSnapshot,
  doc,
} from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';

export default function DashboardScreen() {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState('—');
  const [lastUpdated, setLastUpdated] = useState('—');
  const [limit, setLimit] = useState(50);
  const [connected, setConnected] = useState(false);

  // 1. Listen to latest reading from Firestore (live)
  useEffect(() => {
    const q = query(
      collection(db, 'readings'),
      orderBy('timestamp', 'desc'),
      limitQuery(1)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const data = snap.docs[0].data();
        setTemperature(data.temperature ?? null);
        setDeviceId(data.deviceId ?? 'unknown');
        setLastUpdated(new Date().toLocaleTimeString());
        setConnected(true);
      } else {
        setConnected(false);
      }
    });

    return unsubscribe;
  }, []);

  // 2. Listen to user's threshold setting (live)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const ref = doc(db, 'settings', user.uid);
    const unsubscribe = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setLimit(snap.data().temperatureLimit ?? 50);
      }
    });

    return unsubscribe;
  }, []);

  const isAbnormal = temperature !== null && temperature > limit;

  return (
    <View style={styles.container}>
      <Text style={styles.deviceName}>📡 {deviceId}</Text>
      <Text style={[styles.status, { color: connected ? 'green' : 'gray' }]}>
        {connected ? '● Connected' : '● Waiting for data...'}
      </Text>

      <View style={styles.tempCard}>
        <Text style={styles.tempValue}>
          {temperature !== null ? `${temperature}°C` : '—'}
        </Text>
        <Text style={[styles.tempStatus, { color: isAbnormal ? 'red' : 'green' }]}>
          {temperature === null
            ? '⏳ No data yet'
            : isAbnormal
            ? '🔴 ABNORMAL'
            : '🟢 NORMAL'}
        </Text>
      </View>

      <Text style={styles.limitText}>Alert threshold: {limit}°C</Text>
      <Text style={styles.lastUpdated}>Last updated: {lastUpdated}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 20,
  },
  deviceName: { fontSize: 18, fontWeight: '600', marginBottom: 4 },
  status: { fontSize: 14, marginBottom: 30 },
  tempCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e91e63',
    width: '100%',
  },
  tempValue: { fontSize: 64, fontWeight: 'bold' },
  tempStatus: { fontSize: 20, fontWeight: '600', marginTop: 10 },
  limitText: { marginTop: 20, fontSize: 14, opacity: 0.7 },
  lastUpdated: { marginTop: 10, opacity: 0.5, fontSize: 12 },
});