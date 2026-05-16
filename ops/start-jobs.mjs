import { createServer } from 'node:http';

const port = Number(process.env.PORT ?? 3000);

const server = createServer((request, response) => {
  if (request.url === '/' || request.url === '/health') {
    response.writeHead(200, { 'content-type': 'application/json' });
    response.end(JSON.stringify({ ok: true, service: 'jobs' }));
    return;
  }

  response.writeHead(404, { 'content-type': 'application/json' });
  response.end(JSON.stringify({ ok: false }));
});

server.listen(port, '0.0.0.0', async () => {
  console.log(`jobs.health_server_started port=${port}`);
  try {
    await import('../dist/jobs/standalone.js');
  } catch (error) {
    console.error('jobs.entrypoint_failed', error);
    server.close(() => process.exit(1));
  }
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
