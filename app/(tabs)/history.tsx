import { useState, useEffect } from 'react';
import { StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { Text, View } from '@/components/Themed';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

type Reading = {
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

export default function HistoryScreen() {
  const [readings, setReadings] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const readingsQuery = query(
      collection(db, 'readings'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      readingsQuery,
      (snapshot) => {
        const data = snapshot.docs.map((document) => ({
          id: document.id,
          ...(document.data() as Omit<Reading, 'id'>),
        }));

        setReadings(data);
        setLoading(false);
      },
      (error) => {
        console.error('Failed to load readings:', error);
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

  if (readings.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>No readings yet</Text>
        <Text style={styles.emptyHint}>
          Data will appear here once your sensor sends it
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={readings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isAbnormal = item.status === 'ABNORMAL';
          const time = new Date(item.timestamp).toLocaleString();

          return (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
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

                {item.speed !== undefined && (
                  <Text style={styles.meta}>
                    Speed: {item.speed.toFixed(2)} km/h
                  </Text>
                )}

                {item.satellites !== undefined && (
                  <Text style={styles.meta}>
                    Satellites: {item.satellites}
                  </Text>
                )}
              </View>

              <Text
                style={[
                  styles.badge,
                  { color: isAbnormal ? 'red' : 'green' },
                ]}
              >
                {isAbnormal ? 'ABNORMAL' : 'NORMAL'}
              </Text>
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyHint: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 14,
  },
  rowLeft: {
    flex: 1,
    paddingRight: 12,
  },
  temp: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  meta: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    color: 'green',
    marginTop: 6,
  },
  badge: {
    fontSize: 13,
    fontWeight: '600',
  },
  separator: {
    height: 1,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
});