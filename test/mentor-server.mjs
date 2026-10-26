import assert from 'node:assert/strict';

globalThis.fetch = async (input, init) => {
  const url = new URL(input);
  assert.equal(url.origin, 'https://mentor.statechange.ai');
  assert.ok(['/api/mcp-tools', '/api/models'].includes(url.pathname), url.pathname);
  const key = init.headers['X-API-Key'];
  assert.ok(['test-mentor-key', 'invalid-fixture'].includes(key));
  if (key === 'invalid-fixture') return new Response('{}', { status: 401 });
  return Response.json(url.pathname === '/api/models' ? { models: [] } : { tools: [] });
};
