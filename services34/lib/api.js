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
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: { email } }),
  resetPassword: (token, password) => request('/auth/reset-password', { method: 'POST', body: { token, password } }),
  changePassword: (payload, token) => request('/auth/change-password', { method: 'POST', body: payload, token }),

  categories: () => request('/categories'),
  createMission: (payload, token) => request('/missions', { method: 'POST', body: payload, token }),
  myMissions: (userId, token) => request(`/missions?clientId=${userId}`, { token }),
  mission: (id, token) => request(`/missions/${id}`, { token }),
  acceptOffer: (offerId, chosenSlot, token) => request(`/offers/${offerId}/accept`, { method: 'POST', body: chosenSlot ? { chosenSlot } : undefined, token }),
  receivedOffers: (token) => request('/offers/received', { token }),

  myBookings: (token) => request('/bookings/mine', { token }),
  startBooking: (id, token) => request(`/bookings/${id}/start`, { method: 'PATCH', token }),
  markBookingDone: (id, token) => request(`/bookings/${id}/mark-done`, { method: 'PATCH', token }),
  completeBooking: (id, token) => request(`/bookings/${id}/complete`, { method: 'PATCH', token }),

  createPaymentIntent: (bookingId, token) => request(`/payments/${bookingId}/create-intent`, { method: 'POST', token }),
  releasePayment: (bookingId, token) => request(`/payments/${bookingId}/release`, { method: 'POST', token }),
  spendingHistory: (token) => request('/payments/spending-history', { token }),
  taxSummary: (token) => request('/payments/tax-summary', { token }),
  createSetupIntent: (token) => request('/payments/setup-intent', { method: 'POST', token }),
  paymentMethods: (token) => request('/payments/payment-methods', { token }),
  setDefaultPaymentMethod: (id, token) => request(`/payments/payment-methods/${id}/default`, { method: 'POST', token }),
  deletePaymentMethod: (id, token) => request(`/payments/payment-methods/${id}`, { method: 'DELETE', token }),

  updateMe: (payload, token) => request('/users/me', { method: 'PATCH', body: payload, token }),
  deleteAccount: (token) => request('/users/me', { method: 'DELETE', token }),

  startConversation: (payload, token) => request('/messages/conversations', { method: 'POST', body: payload, token }),
  conversations: (token) => request('/messages/conversations', { token }),
  conversation: (id, token) => request(`/messages/conversations/${id}`, { token }),
  sendMessage: (id, content, token) => request(`/messages/conversations/${id}/messages`, { method: 'POST', body: { content }, token }),

  submitReview: (payload, token) => request('/reviews', { method: 'POST', body: payload, token }),

  submitContactMessage: (payload, token) => request('/contact-messages', { method: 'POST', body: payload, token }),
};

export { API_URL };
