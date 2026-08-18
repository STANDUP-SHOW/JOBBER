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

  notificationCounts: (token) => request('/notification-counts', { token }),
  markSectionSeen: (section, token) => request(`/notification-counts/${section}/seen`, { method: 'POST', token }),

  missionsReceived: (token) => request('/missions/received', { token }),
  missionDetail: (missionId, token) => request(`/missions/${missionId}`, { token }),
  publishToJobber: (missionId, token) => request(`/missions/${missionId}/publish-to-jobber`, { method: 'POST', token }),
  missionAgence: (missionId, payload, token) => request(`/missions/${missionId}/agence`, { method: 'POST', body: payload, token }),
  travelFees: (missionId, token) => request(`/missions/${missionId}/travel-fees`, { token }),
  missionsPropositionsEnAttente: (token) => request('/missions/agence/propositions-en-attente', { token }),

  createAgencyMission: (payload, token) => request('/missions', { method: 'POST', body: payload, token }),
  missionsNouvelleAgence: (token) => request('/missions/nouvelle-agence', { token }),

  plannings: (token) => request('/plannings', { token }),
  createPlanning: (payload, token) => request('/plannings', { method: 'POST', body: payload, token }),
  assignPlanning: (missionId, planningId, token) => request(`/missions/${missionId}/assign-planning`, { method: 'POST', body: { planningId }, token }),

  missionsPublished: (token) => request('/missions/published', { token }),

  offers: (token) => request('/offers', { token }),
  acceptOffer: (offerId, token) => request(`/offers/${offerId}/accept`, { method: 'POST', token }),
  refuseOffer: (offerId, reason, token) => request(`/offers/${offerId}/refuse`, { method: 'POST', body: { reason }, token }),
  createQuote: (offerId, amount, token) => request(`/offers/${offerId}/quote`, { method: 'POST', body: { amount }, token }),
  offreAcceptee: (token) => request('/missions/offre-acceptee', { token }),
  commanderMission: (bookingId, token) => request(`/bookings/${bookingId}/commander`, { method: 'POST', token }),
  validerFinMission: (bookingId, token) => request(`/bookings/${bookingId}/valider-fin-mission`, { method: 'PATCH', token }),

  missionsJobberEnCours: (token) => request('/missions/jobber/en-cours', { token }),
  missionsJobberTerminees: (token) => request('/missions/jobber/terminees', { token }),
  missionsAgenceEnCours: (token) => request('/missions/agence/en-cours', { token }),
  missionsAgenceTerminees: (token) => request('/missions/agence/terminees', { token }),
  embaucherEmploye: (missionId, jobberId, token) => request(`/missions/${missionId}/embaucher-employe`, { method: 'POST', body: { jobberId }, token }),

  invoices: (type, token) => request(`/invoices?type=${type}`, { token }),
  generateMissionInvoice: (missionId, token) => request(`/invoices/generate-mission/${missionId}`, { method: 'POST', token }),
  generateMonthlyInvoice: (type, token) => request('/invoices/generate-monthly', { method: 'POST', body: { type }, token }),

  employees: (token) => request('/employees', { token }),
  addEmployee: (jobberId, token) => request('/employees', { method: 'POST', body: { jobberId }, token }),
  embauche: (jobberId, payload, token) => request(`/employees/${jobberId}/embauche`, { method: 'POST', body: payload, token }),

  contactMessages: (token) => request('/contact-messages', { token }),
  contactMessage: (id, token) => request(`/contact-messages/${id}`, { token }),
  markContactMessage: (id, status, token) => request(`/contact-messages/${id}`, { method: 'PATCH', body: { status }, token }),

  clients: (search, token) => request(`/clients${search ? `?search=${encodeURIComponent(search)}` : ''}`, { token }),
  client: (id, token) => request(`/clients/${id}`, { token }),
};
