// Talks to the SAME backend as jobber.city — Services 34 is a corporate
// account inside Jobber's own database, this site is just a branded
// storefront in front of it.
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}/api${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
}

export const api = {
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  me: (token) => request('/auth/me', { token }),

  categories: () => request('/categories'),
  createMission: (payload, token) => request('/missions', { method: 'POST', body: payload, token }),
  myMissions: (userId, token) => request(`/missions?clientId=${userId}`, { token }),

  startConversation: (payload, token) => request('/messages/conversations', { method: 'POST', body: payload, token }),
  conversation: (id, token) => request(`/messages/conversations/${id}`, { token }),
  sendMessage: (id, content, token) => request(`/messages/conversations/${id}/messages`, { method: 'POST', body: { content }, token }),
};

export { API_URL };
