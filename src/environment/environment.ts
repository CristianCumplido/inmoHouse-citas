export const environment = {
  apiUrl: 'http://localhost:3000/api/v1',
  microfrontendUrl: 'http://localhost:5000',
  hostUrl: 'http://localhost:4200',
  name: 'appointments',
  version: '1.0.0',
  features: {
    enableNotifications: false,
    enableRealTimeUpdates: false,
    enableAnalytics: false,
  },
  auth: {
    tokenKey: 'token',
    userKey: 'user',
    refreshTokenKey: 'refreshToken',
  },
};
