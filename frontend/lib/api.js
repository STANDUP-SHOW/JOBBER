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
  googleAuth: (credential) => request('/auth/google', { method: 'POST', body: { credential } }),

  categories: () => request('/categories'),

  createMission: (payload, token) => request('/missions', { method: 'POST', body: payload, token }),
  listMissions: (params = {}, token) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/missions${qs ? `?${qs}` : ''}`, { token });
  },
  getMission: (id) => request(`/missions/${id}`),
  cancelMission: (id, token) => request(`/missions/${id}/cancel`, { method: 'PATCH', token }),

  createOffer: (payload, token) => request('/offers', { method: 'POST', body: payload, token }),
  acceptOffer: (offerId, token) => request(`/offers/${offerId}/accept`, { method: 'POST', token }),
  myOffers: (token) => request('/offers/mine', { token }),

  myBookings: (token) => request('/bookings/mine', { token }),
  startBooking: (id, token) => request(`/bookings/${id}/start`, { method: 'PATCH', token }),
  completeBooking: (id, token) => request(`/bookings/${id}/complete`, { method: 'PATCH', token }),

  createPaymentIntent: (bookingId, token) => request(`/payments/${bookingId}/create-intent`, { method: 'POST', token }),
  releasePayment: (bookingId, token) => request(`/payments/${bookingId}/release`, { method: 'POST', token }),
  connectSetup: (payload, token) => request('/payments/connect/setup', { method: 'POST', body: payload, token }),
  connectPayout: (token) => request('/payments/connect/payout', { method: 'POST', token }),
  walletHistory: (token) => request('/payments/wallet-history', { token }),
  spendingHistory: (token) => request('/payments/spending-history', { token }),
  taxSummary: (token) => request('/payments/tax-summary', { token }),
  createSetupIntent: (token) => request('/payments/setup-intent', { method: 'POST', token }),
  paymentMethods: (token) => request('/payments/payment-methods', { token }),
  setDefaultPaymentMethod: (id, token) => request(`/payments/payment-methods/${id}/default`, { method: 'POST', token }),
  deletePaymentMethod: (id, token) => request(`/payments/payment-methods/${id}`, { method: 'DELETE', token }),
  getSubscription: (token) => request('/payments/subscription', { token }),
  subscribe: (plan, token) => request('/payments/subscribe', { method: 'POST', body: { plan }, token }),
  cancelSubscription: (token) => request('/payments/subscribe/cancel', { method: 'POST', token }),

  updateMe: (payload, token) => request('/users/me', { method: 'PATCH', body: payload, token }),
  deleteAccount: (token) => request('/users/me', { method: 'DELETE', token }),
  providers: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/users/providers${qs ? `?${qs}` : ''}`);
  },
  provider: (id) => request(`/users/providers/${id}`),
  myReferral: (token) => request('/users/me/referral', { token }),
  updateProviderProfile: (payload, token) => request('/users/me/provider-profile', { method: 'PATCH', body: payload, token }),

  conversations: (token) => request('/messages/conversations', { token }),
  conversation: (id, token) => request(`/messages/conversations/${id}`, { token }),
  sendMessage: (id, content, token) => request(`/messages/conversations/${id}/messages`, { method: 'POST', body: { content }, token }),

  submitReview: (payload, token) => request('/reviews', { method: 'POST', body: payload, token }),
  userReviews: (userId) => request(`/reviews/user/${userId}`),

  uploadVerificationDoc: (payload, token) => request('/verification', { method: 'POST', body: payload, token }),
  myVerificationDocs: (token) => request('/verification/mine', { token }),
  verificationQueue: (token) => request('/verification/queue', { token }),
  verificationDecision: (id, approve, token) => request(`/verification/${id}/decision`, { method: 'PATCH', body: { approve }, token }),

  adminStats: (token) => request('/admin/stats', { token }),
  adminUsers: (token) => request('/admin/users', { token }),

  createCategory: (payload, token) => request('/categories', { method: 'POST', body: payload, token }),
  updateCategory: (id, payload, token) => request(`/categories/${id}`, { method: 'PATCH', body: payload, token }),
  deleteCategory: (id, token) => request(`/categories/${id}`, { method: 'DELETE', token }),
  createService: (categoryId, name, token) => request(`/categories/${categoryId}/services`, { method: 'POST', body: { name }, token }),
  deleteService: (id, token) => request(`/categories/services/${id}`, { method: 'DELETE', token }),
};

export { API_URL };
