const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    credentials: 'include',
  });

  const data = await res.json();

  // Licença expirada ou acesso bloqueado
  if (res.status === 402 || res.status === 403) {
    const reason = data.blocked ? 'blocked' : 'expired';
    if (typeof window !== 'undefined' && !window.location.pathname.includes('licenca-bloqueada')) {
      window.location.href = `/licenca-bloqueada?reason=${reason}`;
    }
    throw new Error(data.error || 'Acesso bloqueado');
  }

  if (!res.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

// Para chamadas admin (usa Authorization header, não cookie)
export async function adminRequest<T>(path: string, secret: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${secret}`,
      ...options?.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Erro');
  return data as T;
}
