import { useCallback, useRef, useState } from 'react';
import { ApiResponse } from '../types';

export function useFetchData<T>() {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiRef = useRef<(() => Promise<ApiResponse<T>>) | null>(null);

  const fetchData = useCallback(async (api: () => Promise<ApiResponse<T>>) => {
    apiRef.current = api;
    try {
      setLoading(true);
      setError(null);
      const response = await api();
      if (response.code === 0) {
        setData(response.data);
      } else {
        setError(response.desc || response.des || '获取数据失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '网络请求失败');
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => {
    if (apiRef.current) {
      fetchData(apiRef.current);
    }
  }, [fetchData]);

  return { data, loading, error, fetchData, setData, setError, refresh };
}
