// 天气数据相关类型定义

/**
 * 天气预报数据
 */
export interface WeatherForecast {
  date: string;           // 日期 (格式: MM-DD)
  text: string;           // 天气描述 (晴/多云/小雨等)
  tempMin: number;        // 最低温度
  tempMax: number;        // 最高温度
  aqi: string;            // 空气质量 (优/良/轻度污染等)
  wind: string;           // 风向风速 (西南风5级)
}

/**
 * 当前天气数据
 */
export interface WeatherData {
  temp: number;           // 当前温度
  tempMin: number;        // 最低温度
  tempMax: number;        // 最高温度
  text: string;           // 天气描述
  icon: string;           // 天气图标
  updateTime: string;     // 更新时间
  forecast: WeatherForecast[]; // 未来天气预报
}

/**
 * 天气API响应
 */
export interface WeatherResponse {
  success: boolean;
  data?: WeatherData;
  message?: string;
}
