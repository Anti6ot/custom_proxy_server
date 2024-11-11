import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import dotenv from 'dotenv';
dotenv.config();
const login = process.env.PX_LOGIN;
const password = process.env.PX_PASSWORD;
const ip = process.env.PX_IP;

const app = express();

// Первый прокси для подмены на выдуманный IP
const firstProxy = createProxyMiddleware({
    target: 'http://localhost:5051',
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        proxyReq.setHeader('X-Forwarded-For', '203.0.113.1'); // Выдуманный IP
    }
});

// Второй прокси для подмены на PX_IP с аутентификацией
const secondProxy = createProxyMiddleware({
    target: `http://${ip}`,
    changeOrigin: true,
    onProxyReq: (proxyReq, req, res) => {
        // Добавление аутентификационных данных
        const auth = Buffer.from(`${login}:${password}`).toString('base64');
        proxyReq.setHeader('Proxy-Authorization', 'Basic ' + auth);
        proxyReq.setHeader('X-Forwarded-For', `${ip}`); // PX_IP купленный
    }
});

// Запуск первого прокси-сервера на порту 5050
app.use('/', firstProxy);
app.listen(5050, () => {
    console.log('First proxy server is running on port 5050');
});

// Запуск второго прокси-сервера на порту 5051
const app2 = express();
app2.use('/', secondProxy);
app2.listen(5051, () => {
    console.log('Second proxy server is running on port 5051');
});
