/**
 * R2 키(photo.id)를 URL-safe base64로 인코딩/디코딩
 * 서버·클라이언트 양쪽에서 동작
 */

export function encodePhotoKey(key: string): string {
  if (typeof Buffer !== "undefined") {
    // Node.js
    return Buffer.from(key).toString("base64url");
  }
  // 브라우저
  const bytes = new TextEncoder().encode(key);
  const binary = Array.from(bytes, (b) => String.fromCharCode(b)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export function decodePhotoKey(encoded: string): string {
  if (typeof Buffer !== "undefined") {
    // Node.js
    return Buffer.from(encoded, "base64url").toString("utf8");
  }
  // 브라우저
  const padded = encoded + "==".slice(0, (4 - (encoded.length % 4)) % 4);
  const binary = atob(padded.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(Array.from(binary, (c) => c.charCodeAt(0)));
  return new TextDecoder().decode(bytes);
}
