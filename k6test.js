import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const failureRate = new Rate('failed_requests');

export const options = {
    stages: [
        { duration: '20s', target: 100 },
        { duration: '50s', target: 100 },
        { duration: '20s', target: 0 },
    ],
    thresholds: {
        failed_requests: ['rate<0.001'],
        http_req_duration: ['p(95)<500'],
    },
};

const BASE_URL = 'http://localhost:8888';

const USER_CREDENTIALS = {
    email: 'admin@demo.com', // adjust based on your schema
    password: 'admin123',
};

export default function () {
    // Login
    const loginRes = http.post(`${BASE_URL}/api/login`, JSON.stringify(USER_CREDENTIALS), {
        headers: { 'Content-Type': 'application/json' },
    });

    check(loginRes, {
        'login successful': (r) => r.status === 200
    }) || failureRate.add(1);

    const token = loginRes.json('result.token');
    const authHeaders = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
    };

    const getClientsRes = http.get(`${BASE_URL}/api/client/list?page=1&items=30`, {
        headers: authHeaders,
    });

    check(getClientsRes, {
        'get clients success': (r) => r.status === 200,
    }) || failureRate.add(1);

    // Create client
    const createClientRes = http.post(`${BASE_URL}/api/client/create`, JSON.stringify({
        name: "ClientName",
        country : "AL",
        address: "Tomsk",
        phone: "+79123456789",
        email: "client@gmail.com"
    }), {
        headers: authHeaders
    });

    check(createClientRes, {
        'create client success': (r) => r.status === 200,
    }) || failureRate.add(1);

    const clientId = createClientRes.json('result._id')

    // Delete client
    const deleteClientRes = http.del(`${BASE_URL}/api/client/delete${clientId}`, {
        headers: authHeaders
    });

    check(createClientRes, {
        'delete client success': (r) => r.status === 200,
    }) || failureRate.add(1);


    // Logout
    const logoutRes = http.post(`${BASE_URL}/api/logout`, null, { headers: authHeaders });

    check(logoutRes, {
        'logout successful': (r) => r.status === 200,
    }) || failureRate.add(1);

    sleep(1);
}
