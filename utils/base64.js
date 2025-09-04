export function base64ToArrayBuffer(base64: string) {
  const cleaned = base64.replace(/^data:image\/\w+;base64,/, '');
  const binary = globalThis.atob ? atob(cleaned) : Buffer.from(cleaned, 'base64').toString('binary');
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}
