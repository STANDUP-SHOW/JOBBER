import { API_URL } from './api';

async function request(path, { method = 'GET', body, token } = {}) {
  const res = await fetch(`${API_URL}/api/agency-admin${path}`, {
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

export const agencyApi = {
  login: (payload) => request('/login', { method: 'POST', body: payload }),
  me: (token) => request('/me', { token }),
  updateCredentials: (payload, token) => request('/credentials', { method: 'PATCH', body: payload, token }),

  missionsReceived: (token) => request('/missions/received', { token }),
  publishToJobber: (missionId, token) => request(`/missions/${missionId}/publish-to-jobber`, { method: 'POST', token }),
  missionAgence: (missionId, payload, token) => request(`/missions/${missionId}/agence`, { method: 'POST', body: payload, token }),

  createAgencyMission: (payload, token) => request('/missions', { method: 'POST', body: payload, token }),
  missionsNouvelleAgence: (token) => request('/missions/nouvelle-agence', { token }),

  plannings: (token) => request('/plannings', { token }),
  createPlanning: (payload, token) => request('/plannings', { method: 'POST', body: payload, token }),
  assignPlanning: (missionId, planningId, token) => request(`/missions/${missionId}/assign-planning`, { method: 'POST', body: { planningId }, token }),

  missionsPublished: (token) => request('/missions/published', { token }),

  offers: (token) => request('/offers', { token }),
  acceptOffer: (offerId, token) => request(`/offers/${offerId}/accept`, { method: 'POST', token }),
  refuseOffer: (offerId, reason, token) => request(`/offers/${offerId}/refuse`, { method: 'POST', body: { reason }, token }),

  missionsJobberEnCours: (token) => request('/missions/jobber/en-cours', { token }),
  missionsJobberTerminees: (token) => request('/missions/jobber/terminees', { token }),
  missionsAgenceEnCours: (token) => request('/missions/agence/en-cours', { token }),
  missionsAgenceTerminees: (token) => request('/missions/agence/terminees', { token }),

  invoices: (type, token) => request(`/invoices?type=${type}`, { token }),
  generateMissionInvoice: (missionId, token) => request(`/invoices/generate-mission/${missionId}`, { method: 'POST', token }),
  generateMonthlyInvoice: (type, token) => request('/invoices/generate-monthly', { method: 'POST', body: { type }, token }),

  employees: (token) => request('/employees', { token }),
  addEmployee: (jobberId, token) => request('/employees', { method: 'POST', body: { jobberId }, token }),
  embauche: (jobberId, payload, token) => request(`/employees/${jobberId}/embauche`, { method: 'POST', body: payload, token }),
};
