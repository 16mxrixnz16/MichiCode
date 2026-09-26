import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateShortCode } from '../utils/generateShortCode.js';
import { isValidHttpUrl, toUrlDto } from '../services/urlService.js';

test('generateShortCode devuelve 6 caracteres alfanuméricos', () => {
  for (let i = 0; i < 100; i++) {
    assert.match(generateShortCode(), /^[a-zA-Z0-9]{6}$/);
  }
});

test('isValidHttpUrl acepta solo http y https', () => {
  assert.equal(isValidHttpUrl('https://example.com'), true);
  assert.equal(isValidHttpUrl('http://localhost:5000/x'), true);
  assert.equal(isValidHttpUrl('ftp://example.com'), false);
  assert.equal(isValidHttpUrl('javascript:alert(1)'), false);
  assert.equal(isValidHttpUrl('no es una url'), false);
});

test('toUrlDto convierte el documento al formato del frontend', () => {
  const created = new Date('2026-01-01T00:00:00Z');
  const dto = toUrlDto({
    short_code: 'abc123',
    original_url: 'https://example.com',
    short_url: 'http://localhost:5000/abc123',
    clicks: 3,
    created_at: created,
  });
  assert.deepEqual(dto, {
    shortCode: 'abc123',
    originalUrl: 'https://example.com',
    shortUrl: 'http://localhost:5000/abc123',
    clicks: 3,
    createdAt: created,
  });
});
