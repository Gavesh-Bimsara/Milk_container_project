import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Text, View } from '@/components/Themed';

type DeviceLocation = {
  latitude: number;
  longitude: number;
  deviceId: string;
  lastSeen?: string;
  online?: boolean;
};

export default function LocationScreen() {
  const [location, setLocation] = useState<DeviceLocation | null>(null);

  useEffect(() => {
    const deviceReference = doc(
      db,
      'devices',
      'milk-container-01'
    );

    const unsubscribe = onSnapshot(
      deviceReference,
      (snapshot) => {
        if (!snapshot.exists()) {
          return;
        }

        const data = snapshot.data();

        if (
          typeof data.latitude === 'number' &&
          typeof data.longitude === 'number'
        ) {
          setLocation({
            latitude: data.latitude,
            longitude: data.longitude,
            deviceId: data.deviceId ?? 'milk-container-01',
            lastSeen: data.lastSeen,
            online: data.online,
          });
        }
      },
      (error) => {
        console.error('Failed to load device location:', error);
      }
    );

    return unsubscribe;
  }, []);

  if (!location) {
    return (
      <View style={styles.center}>
        <Text>Waiting for GPS location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
          title={location.deviceId}
          description="Current milk container location"
        />
      </MapView>

      <View style={styles.details}>
        <Text style={styles.deviceName}>{location.deviceId}</Text>

        <Text style={styles.coordinates}>
          Latitude: {location.latitude.toFixed(6)}
        </Text>

        <Text style={styles.coordinates}>
          Longitude: {location.longitude.toFixed(6)}
        </Text>

        <Text
          style={[
            styles.online,
            { color: location.online ? 'green' : 'red' },
          ]}
        >
          {location.online ? 'Online' : 'Offline'}
        </Text>

        {location.lastSeen && (
          <Text style={styles.lastSeen}>
            Last seen: {location.lastSeen}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  map: {
    flex: 1,
  },
  details: {
    padding: 16,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  coordinates: {
    fontSize: 14,
    marginTop: 4,
  },
  online: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  lastSeen: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
});