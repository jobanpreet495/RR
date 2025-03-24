const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/upload',
    createProxyMiddleware({
      target: 'http://172.178.94.66:8081',
      changeOrigin: true,
    })
  );

  app.use(
    '/person_details',
    createProxyMiddleware({
      target: 'http://172.174.211.168:8000',
      changeOrigin: true,
    })
  );

}; 