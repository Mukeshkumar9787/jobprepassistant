const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export class ApiError extends Error {
  statusCode: number;
  code?: string;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Universal fetch wrapper with credentials (cookies) and token fallback.
 */
export async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Include httpOnly cookies
  });

  if (res.status === 204) {
    return {} as T;
  }

  const data = await res.json();

  if (!res.ok) {
    const errorMsg = data.error?.message || data.error || 'An error occurred';
    const errorCode = data.error?.code || 'UNKNOWN_ERROR';
    throw new ApiError(errorMsg, res.status, errorCode);
  }

  return data as T;
}
