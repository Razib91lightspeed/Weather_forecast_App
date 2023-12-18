import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  StyleSheet,
  Linking,
  TextInput,
  Platform,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';

const HomeScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [cityName, setCityName] = useState('');
  const [searchedLocation, setSearchedLocation] = useState({
    city: '',
    country: '',
    latitude: '',
    longitude: '',
  });

  useEffect(() => {
    const fetchLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Permission to access location was denied');
          return;
        }

        let location = await Location.getCurrentPositionAsync({});
        setLocation(location);

        setSearchedLocation((prevLocation) => ({
          ...prevLocation,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        }));

        const cityCountryResponse = await fetch(
          `http://api.openweathermap.org/geo/1.0/reverse?lat=${location.coords.latitude}&lon=${location.coords.longitude}&limit=1&appid=dce74fd00b8073fbcb4587a964f5bd95`
        );
        const cityCountryData = await cityCountryResponse.json();

        if (cityCountryData.length > 0) {
          setSearchedLocation((prevLocation) => ({
            ...prevLocation,
            city: cityCountryData[0].name,
            country: cityCountryData[0].country,
          }));
        }
      } catch (error) {
        console.error('Error fetching location:', error);
      }
    };

    fetchLocation();
  }, []);

  const handleSearch = async () => {
    if (cityName.trim() === '') {
      return;
    }

    try {
      const response = await fetch(
        `http://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=dce74fd00b8073fbcb4587a964f5bd95`
      );
      const data = await response.json();

      if (data.cod === '404') {
        console.error('City not found');
        return;
      }

      setLocation({
        coords: {
          latitude: data.coord.lat,
          longitude: data.coord.lon,
        },
      });

      setSearchedLocation({
        city: data.name,
        country: data.sys.country,
        latitude: data.coord.lat,
        longitude: data.coord.lon,
      });
    } catch (error) {
      console.error('Error fetching weather data for the searched city', error);
    }
  };

  const handleGetDirection = () => {
    const { latitude, longitude } = searchedLocation;

    // Open the maps app for navigation
    Linking.openURL(`http://maps.google.com/maps?daddr=${latitude},${longitude}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tableContainer}>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Text style={styles.label}>Latitude</Text>
            <Text>{searchedLocation?.latitude}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>City</Text>
            <Text>{searchedLocation?.city}</Text>
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.cell}>
            <Text style={styles.label}>Longitude</Text>
            <Text>{searchedLocation?.longitude}</Text>
          </View>
          <View style={styles.cell}>
            <Text style={styles.label}>Country</Text>
            <Text>{searchedLocation?.country}</Text>
          </View>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Enter City Name"
            onChangeText={(text) => setCityName(text)}
          />
          <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
            <Text style={styles.searchButtonText}>Search</Text>
          </TouchableOpacity>
        </View>
      </View>

      {location && (
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            region={{
              latitude: parseFloat(searchedLocation.latitude),
              longitude: parseFloat(searchedLocation.longitude),
              latitudeDelta: 0.0922,
              longitudeDelta: 0.0421,
            }}
          >
            <Marker
              coordinate={{
                latitude: parseFloat(searchedLocation.latitude),
                longitude: parseFloat(searchedLocation.longitude),
              }}
              title={searchedLocation.city}
            />
          </MapView>
        </View>
      )}

      <TouchableOpacity
        onPress={handleGetDirection}
        style={[
          styles.button,
          styles.button3D,
          styles.getDirectionButton,
          Platform.OS === 'ios' && { shadowColor: 'black', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 3 },
          Platform.OS === 'android' && { elevation: 5 },
        ]}
      >
        <Text style={styles.buttonText}>Get Direction</Text>
      </TouchableOpacity>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Weather', { location })}
          style={[styles.button, styles.button3D]}
        >
          <Text style={styles.buttonText}>Next Page</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0', // Light gray background color
    padding: 16,
  },
  tableContainer: {
    backgroundColor: '#fff', // White background color
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    width: '100%',
    zIndex: 1, // Ensure the table is above the map
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cell: {
    flex: 1,
    padding: 8,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 8,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#4caf50',
    borderRadius: 5,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  mapContainer: {
    height: 350,
    width: '100%',
    marginBottom: 16,
    zIndex: 0, // Ensure the map is below the table
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonContainer: {
    marginTop: 16,
    flex: 1,
    justifyContent: 'flex-end',
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
  },
  button3D: {
    elevation: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  getDirectionButton: {
    backgroundColor: 'green', // Gold color
    marginTop: 16,
  },
});

export default HomeScreen;
