import { http, HttpResponse } from 'msw';

export const handlers = [
  http.post('/api/auth/login', () =>
    HttpResponse.json({ success: true, data: { token: 'test', user: { id: 1, email: 'test@example.com', role: 'admin' } } })
  ),
  http.get('/api/courses', () =>
    HttpResponse.json({ success: true, data: [] })
  ),
];
