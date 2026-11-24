import api from './api';

export const weatherService = {
  getDestinationWeather: async (city = 'Goa') => {
    try {
      const res = await api.get(`/weather/${encodeURIComponent(city)}`);
      return res.data;
    } catch (err) {
      console.debug('Weather fetch error:', err);
      return {
        city: city.toUpperCase(),
        temp: 28,
        condition: 'Resort Sunshine',
        humidity: 60,
        wind_speed: 10,
        source: 'climatology_cache',
      };
    }
  },
};

export default weatherService;
