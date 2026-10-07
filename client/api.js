export async function api(path, { method = 'GET', body, signal } = {}) {
  let response;
  try {
    response = await fetch(`/api${path}`, {
      method, signal, credentials: 'same-origin',
      headers: { 'Accept-Language': document.documentElement.lang || 'uz', ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === 'AbortError') throw error;
    throw Object.assign(new Error('network_error'), { code: 'network_error' });
  }
  if (response.status === 204) return null;
  const data = await response.json().catch(() => null);
  if (!response.ok) throw Object.assign(new Error(data?.error || 'server_error'), { code: data?.code || 'server_error', status: response.status });
  if (data === null && path !== '/session') throw Object.assign(new Error('server_error'), { code: 'server_error' });
  return data;
}
