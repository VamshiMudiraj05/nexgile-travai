import React, { useState, useEffect } from 'react';
import { weatherService } from '../services/weatherService';
import { Sun, CloudRain, Cloud, Wind } from 'lucide-react';

export const WeatherPill = ({ city = 'Goa', className = '' }) => {
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    let isMounted = true;
    weatherService.getDestinationWeather(city).then((data) => {
      if (isMounted) setWeather(data);
    });
    return () => {
      isMounted = false;
    };
  }, [city]);

  if (!weather) return null;

  const isRain = (weather.condition || '').toLowerCase().includes('rain');
  const isCloud = (weather.condition || '').toLowerCase().includes('cloud') || (weather.condition || '').toLowerCase().includes('overcast');

  return (
    <div
      className={`hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-[#13152C] border border-[#2C315E] text-[#FAF6F0] text-xs font-sans shadow-sm transition-all ${className}`}
      title={`Live Telemetry (${weather.source}): ${weather.city} • ${weather.condition} • Humidity: ${weather.humidity}% • Wind: ${weather.wind_speed}km/h`}
    >
      {isRain ? (
        <CloudRain className="w-3.5 h-3.5 text-sky-400" />
      ) : isCloud ? (
        <Cloud className="w-3.5 h-3.5 text-slate-300" />
      ) : (
        <Sun className="w-3.5 h-3.5 text-[#DFB76C] animate-spin-slow" />
      )}
      <span className="font-medium text-[#FAF6F0]/80">{weather.city}</span>
      <span className="font-mono font-bold text-[#DFB76C]">{weather.temp}°C</span>
      <span className="text-[10px] text-white/50 hidden xl:inline">&bull; {weather.condition}</span>
    </div>
  );
};

export default WeatherPill;
