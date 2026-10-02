import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type AlertReading = {
  id: string;
  temperature: number;
  status: string;
  deviceId: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
  satellites?: number;
};

export default function AlertsScreen() {
  const [alerts, setAlerts] = useState<AlertReading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const readingsQuery = query(
      collection(db, 'readings'),
      where('status', '==', 'ABNORMAL'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      readingsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<AlertReading, 'id'>),
        }));

        setAlerts(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load alerts:', error);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (alerts.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No alerts</Text>
        <Text style={styles.emptyHint}>
          Everything is running normally
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const time = new Date(item.timestamp).toLocaleString();

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.alertIcon}>!</Text>
                <Text style={styles.alertTitle}>High Temperature</Text>
              </View>

              <Text style={styles.temp}>{item.temperature}°C</Text>

              <Text style={styles.meta}>
                Device: {item.deviceId}
              </Text>

              <Text style={styles.meta}>
                Time: {time}
              </Text>

              {item.latitude !== undefined &&
                item.longitude !== undefined && (
                  <Text style={styles.location}>
                    GPS: {item.latitude.toFixed(6)},{' '}
                    {item.longitude.toFixed(6)}
                  </Text>
                )}

              {item.satellites !== undefined && (
                <Text style={styles.meta}>
                  Satellites: {item.satellites}
                </Text>
              )}
            </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  card: {
    paddingVertical: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'red',
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'red',
  },
  temp: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'red',
    marginTop: 6,
  },
  meta: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    color: 'green',
    marginTop: 8,
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
});