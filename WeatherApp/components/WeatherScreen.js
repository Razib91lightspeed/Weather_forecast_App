import React, { useEffect, useState } from 'react';
import { Text, View, TextInput, TouchableOpacity, ScrollView, FlatList, Image, StyleSheet } from 'react-native';

const apiKey = 'Use your own API token here';
const weatherApiUrl = `http://api.openweathermap.org/data/2.5/weather?appid=${apiKey}`;
const forecastApiUrl = `http://api.openweathermap.org/data/2.5/forecast?appid=${apiKey}`;

const WeatherScreen = ({ route, navigation }) => {
  const { location } = route.params;
  const [weatherData, setWeatherData] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [searchedCity, setSearchedCity] = useState('');

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await fetch(
          `${weatherApiUrl}&lat=${location.coords.latitude}&lon=${location.coords.longitude}`
        );
        const data = await response.json();
        setWeatherData(data);
      } catch (error) {
        console.error('Error fetching weather data', error);
      }
    };

    const fetchForecastData = async () => {
      try {
        const response = await fetch(
          `${forecastApiUrl}&lat=${location.coords.latitude}&lon=${location.coords.longitude}`
        );
        const data = await response.json();

        // Filter forecast data to include only one forecast per day
        const filteredData = filterDailyForecast(data.list);

        setForecastData(filteredData);
      } catch (error) {
        console.error('Error fetching forecast data', error);
      }
    };

    fetchWeatherData();
    fetchForecastData();
  }, [location]);

  const filterDailyForecast = (forecastList) => {
    const filteredForecast = [];
    const processedDates = [];

    forecastList.forEach((item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString();

      if (!processedDates.includes(date)) {
        processedDates.push(date);
        filteredForecast.push(item);
      }
    });

    return filteredForecast;
  };

  const handleSearch = async () => {
    if (searchedCity.trim() === '') {
      return;
    }

    try {
      const response = await fetch(
        `http://api.openweathermap.org/data/2.5/weather?q=${searchedCity}&appid=${apiKey}`
      );
      const data = await response.json();

      if (data.cod === '404') {
        console.error('City not found');
        return;
      }

      setWeatherData(data);

      // Fetch forecast data for the new location
      const forecastResponse = await fetch(
        `${forecastApiUrl}&lat=${data.coord.lat}&lon=${data.coord.lon}`
      );
      const forecastData = await forecastResponse.json();

      // Filter forecast data to include only one forecast per day
      const filteredData = filterDailyForecast(forecastData.list);

      setForecastData(filteredData);
    } catch (error) {
      console.error('Error fetching weather data for the searched city', error);
    }
  };

   const renderForecastItem = ({ item }) => (
    <View style={styles.forecastItem}>
      <Text>{new Date(item.dt * 1000).toLocaleDateString()}</Text>
      <Text>{String(Math.round(item.main.temp - 273.15)).padStart(2, '0')}°C</Text>
      {/* Displaying the weather icon for each forecast item */}
      {item.weather[0].icon && (
        <Image
          style={styles.forecastWeatherIcon}
          source={{ uri: `https://openweathermap.org/img/w/${item.weather[0].icon}.png` }}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.headerText}>Weather Screen</Text>
      {weatherData && (
        <View style={styles.tableContainer}>
          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.label}>City</Text>
              <Text>{weatherData.name}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Country</Text>
              <Text>{weatherData.sys.country}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.label}>Temperature</Text>
              <Text>{String(Math.round(weatherData.main.temp - 273.15)).padStart(2, '0')}°C</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Feels Like</Text>
              <Text>{String(Math.round(weatherData.main.feels_like - 273.15)).padStart(2, '0')}°C</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.label}>Wind Speed</Text>
              <Text>{weatherData.wind.speed} m/s</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Humidity</Text>
              <Text>{weatherData.main.humidity}%</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.label}>Sunrise</Text>
              <Text>{new Date(weatherData.sys.sunrise * 1000).toLocaleTimeString()}</Text>
            </View>
            <View style={styles.cell}>
              <Text style={styles.label}>Sunset</Text>
              <Text>{new Date(weatherData.sys.sunset * 1000).toLocaleTimeString()}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.cell}>
              <Text style={styles.label}>Description</Text>
              <Text>{weatherData.weather[0].description}</Text>
            </View>
            <View style={styles.cell}>
              {/* Displaying the weather icon next to the Description */}
              {weatherData.weather[0].icon && (
                <Image
                  style={styles.weatherIcon}
                  source={{ uri: `https://openweathermap.org/img/w/${weatherData.weather[0].icon}.png` }}
                />
              )}
            </View>
          </View>
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Enter City Name"
              onChangeText={(text) => setSearchedCity(text)}
            />
            <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      {forecastData.length > 0 && (
        <View style={styles.forecastContainer}>
          <Text style={styles.forecastHeaderText}>7 Days Forecast</Text>
          <View style={styles.forecastBox}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <FlatList
                data={forecastData}
                keyExtractor={(item) => item.dt.toString()}
                renderItem={renderForecastItem}
                horizontal
              />
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  tableContainer: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    padding: 16,
    marginTop: 16,
    width: '100%',
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
  forecastContainer: {
    marginTop: 16,
  },
  forecastHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
   forecastBox: {
    flexDirection: 'row',
    marginTop: 8,
    backgroundColor: '#c8e6c9', // Light green background color
    padding: 16,
    borderRadius: 10,
  },
  forecastItem: {
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
    padding: 16,
    margin: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  weatherIcon: {
    width: 70,
    height: 70,
  },
  forecastWeatherIcon: {
    width: 40,
    height: 40,
    marginTop: 8,
  },
});

export default WeatherScreen;
