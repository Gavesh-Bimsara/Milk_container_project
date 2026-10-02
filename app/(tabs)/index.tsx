import { useState, useEffect } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
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

type LocationData = {
  latitude: number;
  longitude: number;
  altitude?: number;
  speed?: number;
  satellites?: number;
};

export default function DashboardScreen() {
  const [temperature, setTemperature] = useState<number | null>(null);
  const [deviceId, setDeviceId] = useState('—');
  const [lastUpdated, setLastUpdated] = useState('—');
  const [limit, setLimit] = useState(50);
  const [connected, setConnected] = useState(false);
  const [location, setLocation] = useState<LocationData | null>(null);

  useEffect(() => {
    const readingsQuery = query(
      collection(db, 'readings'),
      orderBy('timestamp', 'desc'),
      limitQuery(1)
    );

    const unsubscribe = onSnapshot(
      readingsQuery,
      (snapshot) => {
        if (snapshot.empty) {
          setConnected(false);
          return;
        }

        const data = snapshot.docs[0].data();

        setTemperature(data.temperature ?? null);
        setDeviceId(data.deviceId ?? 'unknown');
        setLastUpdated(new Date().toLocaleTimeString());
        setConnected(true);

        if (
          typeof data.latitude === 'number' &&
          typeof data.longitude === 'number'
        ) {
          setLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            altitude: data.altitude,
            speed: data.speed,
            satellites: data.satellites,
          });
        }
      },
      (error) => {
        console.error('Failed to load latest reading:', error);
        setConnected(false);
      }
    );

    return unsubscribe;
  }, []);

  useEffect(() => {
    const user = auth.currentUser;

    if (!user) {
      return;
    }

    const settingsReference = doc(db, 'settings', user.uid);

    const unsubscribe = onSnapshot(settingsReference, (snapshot) => {
      if (snapshot.exists()) {
        setLimit(snapshot.data().temperatureLimit ?? 50);
      }
    });

    return unsubscribe;
  }, []);

  const isAbnormal = temperature !== null && temperature > limit;

  return (
    <View style={styles.container}>
      <Text style={styles.deviceName}>{deviceId}</Text>

      <Text style={[styles.status, { color: connected ? 'green' : 'gray' }]}>
        {connected ? 'Connected' : 'Waiting for data...'}
      </Text>

      <View style={styles.tempCard}>
        <Text style={styles.tempValue}>
          {temperature !== null ? `${temperature}°C` : '—'}
        </Text>

        <Text
          style={[
            styles.tempStatus,
            { color: isAbnormal ? 'red' : 'green' },
          ]}
        >
          {temperature === null
            ? 'No data yet'
            : isAbnormal
            ? 'ABNORMAL'
            : 'NORMAL'}
        </Text>
      </View>

      <Text style={styles.limitText}>
        Alert threshold: {limit}°C
      </Text>

      <Text style={styles.lastUpdated}>
        Last updated: {lastUpdated}
      </Text>

      {location && (
        <>
          <Text style={styles.locationTitle}>Current GPS Location</Text>

          <MapView
            style={styles.map}
            region={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
              title={deviceId}
              description="Milk container location"
            />
          </MapView>

          <Text style={styles.coordinates}>
            {location.latitude.toFixed(6)},{' '}
            {location.longitude.toFixed(6)}
          </Text>

          {location.satellites !== undefined && (
            <Text style={styles.gpsInfo}>
              Satellites: {location.satellites}
            </Text>
          )}
        </>
      )}
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
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  status: {
    fontSize: 14,
    marginBottom: 30,
  },
  tempCard: {
    alignItems: 'center',
    padding: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e91e63',
    width: '100%',
  },
  tempValue: {
    fontSize: 64,
    fontWeight: 'bold',
  },
  tempStatus: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 10,
  },
  limitText: {
    marginTop: 20,
    fontSize: 14,
    opacity: 0.7,
  },
  lastUpdated: {
    marginTop: 10,
    opacity: 0.5,
    fontSize: 12,
  },
  locationTitle: {
    alignSelf: 'flex-start',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 8,
  },
  map: {
    width: '100%',
    height: 240,
    borderRadius: 12,
  },
  coordinates: {
    marginTop: 8,
    fontSize: 13,
    color: 'green',
  },
  gpsInfo: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.6,
  },
});