const axios = require('axios');
const logger = require('../utils/logger');

class DisasterService {
  constructor() {
    this.usgsBaseUrl = process.env.USGS_API_URL || 'https://earthquake.usgs.gov/fdsnws/event/1';
    this.noaaBaseUrl = process.env.NOAA_API_URL || 'https://api.weather.gov';
    this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY;
  }

  // Get earthquake data from USGS
  async getEarthquakes(startTime, endTime, minMagnitude = 4.0, region = 'asia') {
    try {
      const params = {
        format: 'geojson',
        starttime: startTime,
        endtime: endTime,
        minmagnitude: minMagnitude,
        orderby: 'time-desc'
      };

      // Add region-specific bounds for Asia
      if (region === 'asia') {
        params.minlatitude = -10;
        params.maxlatitude = 50;
        params.minlongitude = 60;
        params.maxlongitude = 180;
      }

      const response = await axios.get(`${this.usgsBaseUrl}/query`, { params });
      
      return {
        success: true,
        data: response.data.features.map(feature => ({
          id: feature.id,
          type: 'earthquake',
          magnitude: feature.properties.mag,
          location: feature.properties.place,
          time: new Date(feature.properties.time),
          coordinates: {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            depth: feature.geometry.coordinates[2]
          },
          url: feature.properties.url,
          tsunami: feature.properties.tsunami,
          alert: feature.properties.alert,
          significance: feature.properties.sig
        }))
      };
    } catch (error) {
      logger.error('Error fetching earthquake data:', error);
      return { success: false, error: error.message };
    }
  }

  // Get weather alerts and severe weather conditions
  async getWeatherAlerts(region = 'asia') {
    try {
      if (!this.openWeatherApiKey) {
        throw new Error('OpenWeatherMap API key not configured');
      }

      // Define major cities in Asia for weather monitoring
      const asiaCities = [
        { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan' },
        { name: 'Seoul', lat: 37.5665, lon: 126.9780, country: 'South Korea' },
        { name: 'Beijing', lat: 39.9042, lon: 116.4074, country: 'China' },
        { name: 'Shanghai', lat: 31.2304, lon: 121.4737, country: 'China' },
        { name: 'Mumbai', lat: 19.0760, lon: 72.8777, country: 'India' },
        { name: 'Delhi', lat: 28.7041, lon: 77.1025, country: 'India' },
        { name: 'Bangkok', lat: 13.7563, lon: 100.5018, country: 'Thailand' },
        { name: 'Jakarta', lat: -6.2088, lon: 106.8456, country: 'Indonesia' },
        { name: 'Manila', lat: 14.5995, lon: 120.9842, country: 'Philippines' },
        { name: 'Ho Chi Minh City', lat: 10.8231, lon: 106.6297, country: 'Vietnam' }
      ];

      const alerts = [];
      
      // Check weather conditions for each major city
      for (const city of asiaCities) {
        try {
          // Get current weather and 5-day forecast
          const [currentResponse, forecastResponse] = await Promise.all([
            axios.get('https://api.openweathermap.org/data/2.5/weather', {
              params: {
                lat: city.lat,
                lon: city.lon,
                appid: this.openWeatherApiKey,
                units: 'metric'
              }
            }),
            axios.get('https://api.openweathermap.org/data/2.5/forecast', {
              params: {
                lat: city.lat,
                lon: city.lon,
                appid: this.openWeatherApiKey,
                units: 'metric'
              }
            })
          ]);

          // Check for severe weather conditions
          const currentWeather = currentResponse.data;
          const forecast = forecastResponse.data;

          // Check current weather for severe conditions
          if (this.isSevereWeather(currentWeather)) {
            alerts.push({
              id: `weather_${city.name}_${Date.now()}`,
              type: 'weather',
              severity: this.getWeatherSeverity(currentWeather),
              title: `Severe Weather Alert - ${city.name}`,
              description: this.getWeatherDescription(currentWeather),
              startTime: new Date(),
              endTime: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
              region: city.country,
              coordinates: {
                latitude: city.lat,
                longitude: city.lon
              },
              city: city.name,
              temperature: currentWeather.main.temp,
              humidity: currentWeather.main.humidity,
              windSpeed: currentWeather.wind?.speed || 0,
              weatherCondition: currentWeather.weather[0].main
            });
          }

          // Check forecast for severe weather in next 5 days
          forecast.list.forEach((forecastItem, index) => {
            if (this.isSevereWeather(forecastItem)) {
              alerts.push({
                id: `weather_forecast_${city.name}_${index}_${Date.now()}`,
                type: 'weather',
                severity: this.getWeatherSeverity(forecastItem),
                title: `Weather Warning - ${city.name}`,
                description: this.getWeatherDescription(forecastItem),
                startTime: new Date(forecastItem.dt * 1000),
                endTime: new Date(forecastItem.dt * 1000 + 3 * 60 * 60 * 1000), // 3 hours
                region: city.country,
                coordinates: {
                  latitude: city.lat,
                  longitude: city.lon
                },
                city: city.name,
                temperature: forecastItem.main.temp,
                humidity: forecastItem.main.humidity,
                windSpeed: forecastItem.wind?.speed || 0,
                weatherCondition: forecastItem.weather[0].main,
                isForecast: true
              });
            }
          });

        } catch (cityError) {
          logger.warn(`Error fetching weather for ${city.name}:`, cityError.message);
          // Continue with other cities even if one fails
        }
      }

      // Remove duplicates and sort by severity and time
      const uniqueAlerts = this.removeDuplicateAlerts(alerts);
      uniqueAlerts.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity] || new Date(b.startTime) - new Date(a.startTime);
      });

      return { success: true, data: uniqueAlerts };
    } catch (error) {
      logger.error('Error fetching weather alerts:', error);
      return { success: false, error: error.message };
    }
  }

  // Get tsunami warnings (using USGS tsunami data)
  async getTsunamiWarnings() {
    try {
      const response = await axios.get(`${this.usgsBaseUrl}/query`, {
        params: {
          format: 'geojson',
          starttime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endtime: new Date().toISOString().split('T')[0],
          minmagnitude: 6.0,
          orderby: 'time-desc'
        }
      });

      const tsunamiEvents = response.data.features.filter(
        feature => feature.properties.tsunami === 1
      );

      return {
        success: true,
        data: tsunamiEvents.map(feature => ({
          id: `tsunami_${feature.id}`,
          type: 'tsunami',
          magnitude: feature.properties.mag,
          location: feature.properties.place,
          time: new Date(feature.properties.time),
          coordinates: {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0],
            depth: feature.geometry.coordinates[2]
          },
          tsunami: true,
          alert: feature.properties.alert,
          significance: feature.properties.sig
        }))
      };
    } catch (error) {
      logger.error('Error fetching tsunami warnings:', error);
      return { success: false, error: error.message };
    }
  }

  // Get volcanic activity (using USGS volcano data)
  async getVolcanicActivity() {
    try {
      // Using a different USGS endpoint for volcanic activity
      const response = await axios.get('https://www.usgs.gov/volcanoes/feed/geojson.php', {
        timeout: 10000
      });

      const volcanicEvents = response.data.features.filter(
        feature => feature.properties.alert_level && feature.properties.alert_level !== 'green'
      );

      return {
        success: true,
        data: volcanicEvents.map(feature => ({
          id: `volcano_${feature.properties.id}`,
          type: 'volcanic',
          name: feature.properties.volcano_name,
          alertLevel: feature.properties.alert_level,
          location: feature.properties.location,
          coordinates: {
            latitude: feature.geometry.coordinates[1],
            longitude: feature.geometry.coordinates[0]
          },
          lastEruption: feature.properties.last_eruption_year,
          elevation: feature.properties.elevation
        }))
      };
    } catch (error) {
      logger.error('Error fetching volcanic activity:', error);
      return { success: false, error: error.message };
    }
  }

  // Get all disaster data
  async getAllDisasters() {
    try {
      const endTime = new Date();
      const startTime = new Date(endTime.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

      const [earthquakes, weatherAlerts, tsunamiWarnings, volcanicActivity] = await Promise.allSettled([
        this.getEarthquakes(startTime.toISOString(), endTime.toISOString()),
        this.getWeatherAlerts(),
        this.getTsunamiWarnings(),
        this.getVolcanicActivity()
      ]);

      const allDisasters = [];

      if (earthquakes.status === 'fulfilled' && earthquakes.value.success) {
        allDisasters.push(...earthquakes.value.data);
      }

      if (weatherAlerts.status === 'fulfilled' && weatherAlerts.value.success) {
        allDisasters.push(...weatherAlerts.value.data);
      }

      if (tsunamiWarnings.status === 'fulfilled' && tsunamiWarnings.value.success) {
        allDisasters.push(...tsunamiWarnings.value.data);
      }

      if (volcanicActivity.status === 'fulfilled' && volcanicActivity.value.success) {
        allDisasters.push(...volcanicActivity.value.data);
      }

      // Sort by time (most recent first)
      allDisasters.sort((a, b) => new Date(b.time) - new Date(a.time));

      return {
        success: true,
        data: allDisasters,
        count: allDisasters.length,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error fetching all disasters:', error);
      return { success: false, error: error.message };
    }
  }

  // Map severity levels
  mapSeverity(tag) {
    const severityMap = {
      'Minor': 'low',
      'Moderate': 'medium',
      'Severe': 'high',
      'Extreme': 'critical'
    };
    return severityMap[tag] || 'medium';
  }

  // Check if weather conditions are severe
  isSevereWeather(weatherData) {
    const windSpeed = weatherData.wind?.speed || 0;
    const temperature = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const weatherCondition = weatherData.weather[0].main.toLowerCase();
    const description = weatherData.weather[0].description.toLowerCase();

    // Severe wind conditions (Beaufort scale 7+)
    if (windSpeed > 13.9) return true; // 50+ km/h

    // Extreme temperatures
    if (temperature > 40 || temperature < -20) return true;

    // Severe weather conditions
    const severeConditions = [
      'thunderstorm', 'tornado', 'hurricane', 'typhoon', 
      'blizzard', 'snowstorm', 'sandstorm', 'duststorm'
    ];
    
    if (severeConditions.some(condition => 
      weatherCondition.includes(condition) || description.includes(condition)
    )) return true;

    // Heavy rain/snow
    if (description.includes('heavy') || description.includes('extreme')) return true;

    // High humidity with high temperature (heat index)
    if (temperature > 30 && humidity > 80) return true;

    return false;
  }

  // Get weather severity level
  getWeatherSeverity(weatherData) {
    const windSpeed = weatherData.wind?.speed || 0;
    const temperature = weatherData.main.temp;
    const weatherCondition = weatherData.weather[0].main.toLowerCase();
    const description = weatherData.weather[0].description.toLowerCase();

    // Critical conditions
    if (windSpeed > 20.8 || temperature > 45 || temperature < -30) return 'critical';
    if (weatherCondition.includes('tornado') || weatherCondition.includes('hurricane')) return 'critical';

    // High severity
    if (windSpeed > 13.9 || temperature > 40 || temperature < -20) return 'high';
    if (weatherCondition.includes('thunderstorm') && description.includes('heavy')) return 'high';

    // Medium severity
    if (windSpeed > 10.8 || temperature > 35 || temperature < -10) return 'medium';
    if (weatherCondition.includes('thunderstorm') || weatherCondition.includes('blizzard')) return 'medium';

    return 'low';
  }

  // Get weather description
  getWeatherDescription(weatherData) {
    const windSpeed = weatherData.wind?.speed || 0;
    const temperature = weatherData.main.temp;
    const humidity = weatherData.main.humidity;
    const weatherCondition = weatherData.weather[0].main;
    const description = weatherData.weather[0].description;

    let desc = `${weatherCondition}: ${description}`;
    desc += ` | Temperature: ${temperature}°C`;
    desc += ` | Humidity: ${humidity}%`;
    desc += ` | Wind: ${windSpeed} m/s`;

    if (windSpeed > 13.9) desc += ' | High wind warning';
    if (temperature > 40) desc += ' | Extreme heat warning';
    if (temperature < -20) desc += ' | Extreme cold warning';

    return desc;
  }

  // Remove duplicate weather alerts
  removeDuplicateAlerts(alerts) {
    const seen = new Set();
    return alerts.filter(alert => {
      const key = `${alert.city}_${alert.weatherCondition}_${alert.severity}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  // Get disaster statistics
  async getDisasterStats() {
    try {
      const disasters = await this.getAllDisasters();
      
      if (!disasters.success) {
        return disasters;
      }

      const stats = {
        total: disasters.data.length,
        byType: {},
        bySeverity: {
          low: 0,
          medium: 0,
          high: 0,
          critical: 0
        },
        last24Hours: 0,
        last7Days: disasters.data.length
      };

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      disasters.data.forEach(disaster => {
        // Count by type
        stats.byType[disaster.type] = (stats.byType[disaster.type] || 0) + 1;

        // Count by severity
        if (disaster.severity) {
          stats.bySeverity[disaster.severity] = (stats.bySeverity[disaster.severity] || 0) + 1;
        }

        // Count last 24 hours
        if (new Date(disaster.time) > oneDayAgo) {
          stats.last24Hours++;
        }
      });

      return {
        success: true,
        data: stats,
        lastUpdated: new Date()
      };
    } catch (error) {
      logger.error('Error calculating disaster stats:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new DisasterService();

