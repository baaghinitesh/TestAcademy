import { useState, useCallback } from 'react';
import { performanceDebugger } from '@/lib/performance/debug';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface ApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: string) => void;
  retries?: number;
  retryDelay?: number;
}

export function useApi<T = any>(endpoint?: string, options: ApiOptions = {}) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: false,
    error: null
  });

  const makeRequest = useCallback(async (
    url: string,
    method: string = 'GET',
    body?: any,
    customOptions: RequestInit = {}
  ): Promise<T | null> => {
    const requestId = performanceDebugger.startTimer(`API_${method}_${url}`);
    
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const startTime = performance.now();
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...customOptions.headers
        },
        body: body ? JSON.stringify(body) : undefined,
        credentials: 'include',
        ...customOptions
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      performanceDebugger.logApiCall(url, method, duration, response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      setState({
        data: data.data || data,
        loading: false,
        error: null
      });

      if (options.onSuccess) {
        options.onSuccess(data);
      }

      return data;

    } catch (error: any) {
      const errorMessage = error.message || 'An unexpected error occurred';
      
      setState({
        data: null,
        loading: false,
        error: errorMessage
      });

      if (options.onError) {
        options.onError(errorMessage);
      }

      console.error(`API Error (${method} ${url}):`, error);
      return null;

    } finally {
      performanceDebugger.endTimer(requestId);
    }
  }, [options]);

  // GET request
  const get = useCallback((url: string, customOptions?: RequestInit) => {
    return makeRequest(url, 'GET', undefined, customOptions);
  }, [makeRequest]);

  // POST request
  const post = useCallback((url: string, body?: any, customOptions?: RequestInit) => {
    return makeRequest(url, 'POST', body, customOptions);
  }, [makeRequest]);

  // PUT request
  const put = useCallback((url: string, body?: any, customOptions?: RequestInit) => {
    return makeRequest(url, 'PUT', body, customOptions);
  }, [makeRequest]);

  // DELETE request
  const del = useCallback((url: string, customOptions?: RequestInit) => {
    return makeRequest(url, 'DELETE', undefined, customOptions);
  }, [makeRequest]);

  // PATCH request
  const patch = useCallback((url: string, body?: any, customOptions?: RequestInit) => {
    return makeRequest(url, 'PATCH', body, customOptions);
  }, [makeRequest]);

  // Retry failed request
  const retry = useCallback(() => {
    if (endpoint) {
      get(endpoint);
    }
  }, [endpoint, get]);

  // Clear state
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const clearData = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return {
    ...state,
    get,
    post,
    put,
    delete: del,
    patch,
    retry,
    clearError,
    clearData,
    makeRequest
  };
}

// Specialized hooks for common API patterns
export function useFetch<T = any>(url: string, options: ApiOptions = {}) {
  const api = useApi<T>(url, options);
  
  const fetch = useCallback(() => {
    return api.get(url);
  }, [api, url]);

  return {
    ...api,
    fetch,
    refetch: fetch
  };
}

export function useMutation<T = any>(options: ApiOptions = {}) {
  const api = useApi<T>(undefined, options);
  
  const mutate = useCallback((url: string, method: string = 'POST', data?: any) => {
    return api.makeRequest(url, method, data);
  }, [api]);

  return {
    ...api,
    mutate
  };
}