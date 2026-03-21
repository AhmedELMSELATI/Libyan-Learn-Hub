export function useApi() {
  async function apiFetch(path: string, options?: RequestInit) {
    const token = localStorage.getItem('lms_token');
    const res = await fetch(`/api${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw new Error(err.message ?? res.statusText);
    }
    return res.json();
  }

  return {
    apiFetch,
    get: (path: string) => apiFetch(path, { method: 'GET' }),
    post: (path: string, body: any) => apiFetch(path, { method: 'POST', body: JSON.stringify(body) }),
    put: (path: string, body: any) => apiFetch(path, { method: 'PUT', body: JSON.stringify(body) }),
    del: (path: string) => apiFetch(path, { method: 'DELETE' }),
    patch: (path: string, body: any) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(body) }),
  };
}
