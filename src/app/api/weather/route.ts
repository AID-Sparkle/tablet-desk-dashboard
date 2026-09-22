import { NextResponse } from 'next/server';
import { DASHBOARD_CONFIG } from '@/config/dashboard';
import { WeatherData, HourlyForecast, DailyForecast } from '@/types';

// WMO 天気コード -> 日本語の説明
function getWeatherDescription(code: number): string {
  switch (code) {
    case 0: return '快晴';
    case 1: return '晴れ';
    case 2: return '一部曇り';
    case 3: return '曇り';
    case 45: case 48: return '霧';
    case 51: case 53: case 55: return '小雨';
    case 56: case 57: return '着氷性の小雨';
    case 61: return '雨 (弱)';
    case 63: return '雨 (中)';
    case 65: return '激しい雨';
    case 66: case 67: return '着氷性の雨';
    case 71: return '雪 (弱)';
    case 73: return '雪 (中)';
    case 75: return '激しい雪';
    case 77: return '霧雪';
    case 80: case 81: case 82: return 'にわか雨';
    case 85: case 86: return 'にわか雪';
    case 95: return '雷雨';
    case 96: case 99: return '雷雨 (雹伴う)';
    default: return '不明';
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  let lat = searchParams.get('lat') || process.env.WEATHER_LATITUDE || DASHBOARD_CONFIG.weather.latitude;
  let lon = searchParams.get('lon') || process.env.WEATHER_LONGITUDE || DASHBOARD_CONFIG.weather.longitude;
  let cityName = searchParams.get('city') || process.env.WEATHER_CITY_NAME || DASHBOARD_CONFIG.weather.cityName;

  // 地名のみ渡された場合、Open-Meteo Geocoding API で座標を自動検索
  const searchCity = searchParams.get('searchCity');
  if (searchCity) {
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchCity)}&count=1&language=ja&format=json`
      );
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.results && geoData.results.length > 0) {
          const top = geoData.results[0];
          lat = top.latitude.toString();
          lon = top.longitude.toString();
          cityName = top.name;
        }
      }
    } catch (e) {
      console.warn('Geocoding search failed:', e);
    }
  }

  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', lat);
  url.searchParams.set('longitude', lon);
  url.searchParams.set(
    'current',
    'temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m'
  );
  url.searchParams.set('hourly', 'temperature_2m,weather_code,precipitation_probability');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max');
  url.searchParams.set('timezone', 'Asia/Tokyo');
  url.searchParams.set('forecast_days', '7');

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 900 }, // 15分キャッシュ
    });

    if (!res.ok) {
      throw new Error(`Open-Meteo returned status ${res.status}`);
    }

    const data = await res.json();
    const current = data.current || {};
    const hourlyRaw = data.hourly || {};
    const dailyRaw = data.daily || {};

    // 24時間以内の時間別予報を現在時刻以降から6〜8件抽出
    const hourly: HourlyForecast[] = [];
    const currentTimeStr = current.time || '';
    const currentIndex = hourlyRaw.time?.findIndex((t: string) => t >= currentTimeStr) ?? 0;
    const startIdx = currentIndex >= 0 ? currentIndex : 0;

    for (let i = startIdx; i < Math.min(startIdx + 12, hourlyRaw.time?.length || 0); i += 2) {
      const rawTime = hourlyRaw.time[i];
      const hour = new Date(rawTime).getHours();
      hourly.push({
        time: `${hour}:00`,
        temp: Math.round(hourlyRaw.temperature_2m[i] * 10) / 10,
        weatherCode: hourlyRaw.weather_code[i],
        precipitationProbability: hourlyRaw.precipitation_probability?.[i] || 0,
      });
    }

    // 週間予報の整形
    const daily: DailyForecast[] = [];
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    for (let i = 0; i < Math.min(5, dailyRaw.time?.length || 0); i++) {
      const dateObj = new Date(dailyRaw.time[i]);
      const m = dateObj.getMonth() + 1;
      const d = dateObj.getDate();
      const dayStr = dayNames[dateObj.getDay()];
      daily.push({
        date: i === 0 ? '今日' : `${m}/${d} (${dayStr})`,
        weatherCode: dailyRaw.weather_code[i],
        tempMax: Math.round(dailyRaw.temperature_2m_max[i]),
        tempMin: Math.round(dailyRaw.temperature_2m_min[i]),
        precipitationProbability: dailyRaw.precipitation_probability_max?.[i] || 0,
      });
    }

    const weatherData: WeatherData = {
      cityName,
      currentTemp: Math.round((current.temperature_2m ?? 0) * 10) / 10,
      apparentTemp: Math.round((current.apparent_temperature ?? 0) * 10) / 10,
      weatherCode: current.weather_code ?? 0,
      weatherDescription: getWeatherDescription(current.weather_code ?? 0),
      isDay: Boolean(current.is_day),
      humidity: current.relative_humidity_2m ?? 50,
      windSpeed: Math.round((current.wind_speed_10m ?? 0) * 10) / 10,
      precipitationProbability: daily[0]?.precipitationProbability || 0,
      tempMax: daily[0]?.tempMax || Math.round(current.temperature_2m || 0),
      tempMin: daily[0]?.tempMin || Math.round(current.temperature_2m || 0),
      hourly,
      daily,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(weatherData);
  } catch (error) {
    console.error('Failed to fetch weather data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}
