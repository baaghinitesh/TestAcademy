// Safe API client with comprehensive error handling and retry logic

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface ApiClientOptions {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;

  constructor(options: ApiClientOptions = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 30000; // 30 seconds
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000; // 1 second
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private async fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(id);
      return response;
    } catch (error) {
      clearTimeout(id);
      throw error;
    }
  }

  private async makeRequest<T>(
    url: string,
    options: RequestInit = {},
    attempt: number = 1
  ): Promise<ApiResponse<T>> {
    try {
      const fullUrl = this.baseURL + url;
      
      // Default headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      const response = await this.fetchWithTimeout(fullUrl, {
        ...options,
        headers,
      });

      let data: any;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        try {
          data = await response.json();
        } catch (parseError) {
          console.warn('Failed to parse JSON response:', parseError);
          data = null;
        }
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        // Check if this is a network error worth retrying
        const isRetryable = response.status >= 500 || response.status === 429;
        
        if (isRetryable && attempt < this.retries) {
          console.warn(`Request failed with status ${response.status}, retrying (${attempt}/${this.retries})...`);
          await this.delay(this.retryDelay * attempt);
          return this.makeRequest<T>(url, options, attempt + 1);
        }

        return {
          success: false,
          error: data?.error || data?.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          data: data,
        };
      }

      return {
        success: true,
        data: data,
        status: response.status,
      };

    } catch (error: any) {
      console.error(`API request failed (attempt ${attempt}):`, error);

      // Check if this is a network error worth retrying
      const isNetworkError = error.name === 'TypeError' || error.message?.includes('fetch');
      const isTimeoutError = error.name === 'AbortError';
      
      if ((isNetworkError || isTimeoutError) && attempt < this.retries) {
        console.warn(`Network error, retrying (${attempt}/${this.retries})...`);
        await this.delay(this.retryDelay * attempt);
        return this.makeRequest<T>(url, options, attempt + 1);
      }

      return {
        success: false,
        error: error.message || 'Network error occurred',
        status: 0,
      };
    }
  }

  async get<T = any>(url: string, params?: Record<string, any>): Promise<ApiResponse<T>> {
    let fullUrl = url;
    
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      if (searchParams.toString()) {
        fullUrl += '?' + searchParams.toString();
      }
    }

    return this.makeRequest<T>(fullUrl, { method: 'GET' });
  }

  async post<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(url: string, data?: any): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(url: string): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(url, { method: 'DELETE' });
  }
}

// Create a singleton instance
export const apiClient = new ApiClient();

// Safe API call wrapper hook for React components
export function useSafeApiCall() {
  const safeCall = async <T>(
    apiCall: () => Promise<ApiResponse<T>>,
    onSuccess?: (data: T) => void,
    onError?: (error: string) => void
  ): Promise<ApiResponse<T>> => {
    try {
      const result = await apiCall();
      
      if (result.success && result.data && onSuccess) {
        onSuccess(result.data);
      } else if (!result.success && onError) {
        onError(result.error || 'Unknown error occurred');
      }
      
      return result;
    } catch (error: any) {
      console.error('Unexpected error in API call:', error);
      const errorResponse: ApiResponse<T> = {
        success: false,
        error: error.message || 'Unexpected error occurred',
      };
      
      if (onError) {
        onError(errorResponse.error!);
      }
      
      return errorResponse;
    }
  };

  return { safeCall };
}

export default apiClient;