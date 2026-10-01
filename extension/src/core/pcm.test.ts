import { expect, it } from 'vitest';
import { toPcm16Base64 } from './pcm';

const decode = (base64: string) => {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  return Array.from({ length: bytes.length / 2 }, (_, i) => new DataView(bytes.buffer).getInt16(i * 2, true));
};

it('encodes floats as 16-bit little-endian PCM, clamping what is out of range', () => {
  expect(decode(toPcm16Base64(new Float32Array([0, 1, -1, 0.5, 2, -2])))).toEqual([0, 32767, -32768, 16383, 32767, -32768]);
});

it('handles a frame larger than one String.fromCharCode batch', () => {
  expect(decode(toPcm16Base64(new Float32Array(40000).fill(0.25))).every((v) => v === 8191)).toBe(true);
});
