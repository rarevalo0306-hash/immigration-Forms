import { afterEach, describe, expect, it } from 'vitest';
import { GET, OPTIONS, POST } from './agent';

const req = (method: string, body?: unknown, origin = 'https://caminoformularios.com') =>
  new Request('https://caminoformularios.com/api/agent', { method, headers: { origin, 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });

describe('api/agent', () => {
  const key = process.env.ANTHROPIC_API_KEY;
  afterEach(() => {
    if (key === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = key;
  });

  it('says it is off without an API key', async () => {
    delete process.env.ANTHROPIC_API_KEY;
    expect(await (await GET(req('GET'))).json()).toEqual({ enabled: false });
    expect((await POST(req('POST', { messages: [{ role: 'user', content: 'hola' }] }))).status).toBe(503);
  });

  it('allows the site and the app, and no one else', () => {
    expect(OPTIONS(req('OPTIONS')).headers.get('access-control-allow-origin')).toBe('https://caminoformularios.com');
    expect(OPTIONS(req('OPTIONS', undefined, 'capacitor://localhost')).headers.get('access-control-allow-origin')).toBe('capacitor://localhost');
    expect(OPTIONS(req('OPTIONS', undefined, 'https://evil.example')).headers.get('access-control-allow-origin')).toBeNull();
  });

  it('refuses conversations it would not produce', async () => {
    process.env.ANTHROPIC_API_KEY = 'test';
    expect((await POST(req('POST', { messages: [] }))).status).toBe(400);
    expect((await POST(req('POST', { messages: [{ role: 'assistant', content: 'x' }] }))).status).toBe(400);
    expect((await POST(req('POST', { messages: [{ role: 'user', content: [{ type: 'image', source: {} }] }] }))).status).toBe(400);
  });
});
