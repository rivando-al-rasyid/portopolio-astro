const internalPayloadUrl = (import.meta.env.PAYLOAD_API_URL || 'http://localhost:3000').replace(/\/$/, '');
const publicPayloadUrl = (import.meta.env.PUBLIC_PAYLOAD_URL || internalPayloadUrl).replace(/\/$/, '');

export function getPayloadApiUrl() {
  return internalPayloadUrl;
}

export function getPayloadPublicUrl() {
  return publicPayloadUrl;
}

export function makePayloadAssetUrl(value?: string | null) {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) return value;
  return `${publicPayloadUrl}${value.startsWith('/') ? value : `/${value}`}`;
}

export async function fetchPayload<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${internalPayloadUrl}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Payload request failed ${response.status} ${response.statusText}: ${body.slice(0, 300)}`);
  }

  return response.json() as Promise<T>;
}
