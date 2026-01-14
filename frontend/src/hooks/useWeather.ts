import { useQuery } from '@tanstack/react-query';
import apiService from '../services/api';
import type { WeatherData } from '../types/weather';

/**
 * 获取天气数据
 * @param city 城市名称（可选）
 */
export const useWeather = (city?: string) => {
  return useQuery<WeatherData>({
    queryKey: ['weather', city],
    queryFn: () => apiService.getWeather(city),
    staleTime: 1000 * 60 * 30, // 30分钟缓存
    retry: 1,
  });
};
