import React from 'react';
import { SunOutlined, CloudOutlined } from '@ant-design/icons';
import type { WeatherData } from '../../types/weather';
import '../../pages/Workbench.css';

interface WeatherCardProps {
  data?: WeatherData;
}

const WeatherCard: React.FC<WeatherCardProps> = ({ data }) => {
  // 使用传入的数据或默认Mock数据
  const weatherData: WeatherData = data || {
    temp: 26,
    tempMin: 20,
    tempMax: 28,
    text: '晴转多云',
    icon: 'sunny',
    updateTime: new Date().toISOString(),
    forecast: [
      {
        date: '08/24',
        text: '晴',
        tempMin: 20,
        tempMax: 28,
        aqi: '优',
        wind: '西南风5级',
      },
      {
        date: '08/25',
        text: '多云',
        tempMin: 19,
        tempMax: 23,
        aqi: '优',
        wind: '西南风5级',
      },
    ],
  };

  // 格式化当前日期时间
  const formatDateTime = () => {
    const now = new Date();
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日 星期${days[now.getDay()]}`;
  };

  // 获取天气图标
  const getWeatherIcon = (text: string) => {
    if (text.includes('晴')) return <SunOutlined />;
    if (text.includes('云') || text.includes('阴')) return <CloudOutlined />;
    return <SunOutlined />;
  };

  return (
    <div className="wb-card wb-weather-card">
      {/* 当前天气区域 */}
      <div className="wb-weather-current">
        {/* 左侧：天气图标 */}
        <div className="wb-weather-icon-wrapper">
          {getWeatherIcon(weatherData.text)}
        </div>

        {/* 右侧：温度和天气信息 */}
        <div className="wb-weather-info">
          <div className="wb-weather-temp-main">
            <span className="wb-weather-temp">{weatherData.temp}</span>
            <span className="wb-weather-temp-unit">℃</span>
          </div>
          <div className="wb-weather-temp-range">
            /{weatherData.tempMin}-{weatherData.tempMax}℃
          </div>
          <div className="wb-weather-text">{weatherData.text}</div>
          <div className="wb-weather-datetime">{formatDateTime()}</div>
        </div>
      </div>

      {/* 未来天气预报 */}
      <div className="wb-weather-forecast">
        {weatherData.forecast.map((item, index) => (
          <div key={index} className="wb-forecast-item">
            <div className="wb-forecast-date">
              {index === 0 ? '今天' : '明天'} {item.date}
            </div>
            <div className="wb-forecast-icon">{getWeatherIcon(item.text)}</div>
            <div className="wb-forecast-temp">
              {item.tempMin}-{item.tempMax}℃
            </div>
            <div className="wb-forecast-aqi" style={{ color: '#059669' }}>
              {item.aqi}
            </div>
            <div className="wb-forecast-wind">{item.wind}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherCard;
