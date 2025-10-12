// Lightweight Cognito Hosted UI PKCE utilities

export const COGNITO_DOMAIN = process.env.NEXT_PUBLIC_COGNITO_DOMAIN ?? '';
export const COGNITO_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID ?? '';
const TOKEN_ENDPOINT = `https://${COGNITO_DOMAIN}/oauth2/token`;

function b64UrlEncode(buf: ArrayBuffer): string {
  let str = btoa(String.fromCharCode(...new Uint8Array(buf)));
  return str.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return b64UrlEncode(digest);
}

type StartLoginOptions = {
  idp?: 'Google' | 'SignInWithApple';
  signup?: boolean;
};

export async function startLogin(options: StartLoginOptions = {}): Promise<void> {
  const verifier = b64UrlEncode(crypto.getRandomValues(new Uint8Array(32)).buffer);
  const challenge = await sha256(verifier);
  localStorage.setItem('pkce_verifier', verifier);
  const redirectUri = `${window.location.origin}/auth/callback/`;
  const params = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID,
    response_type: 'code',
    scope: 'openid email profile',
    redirect_uri: redirectUri,
    code_challenge_method: 'S256',
    code_challenge: challenge,
  });
  if (options.signup) params.set('screen_hint', 'signup');
  if (options.idp) params.set('identity_provider', options.idp);
  window.location.href = `https://${COGNITO_DOMAIN}/oauth2/authorize?${params.toString()}`;
}

export async function completeLogin(code: string): Promise<void> {
  const verifier = localStorage.getItem('pkce_verifier') || '';
  const redirectUri = `${window.location.origin}/auth/callback/`;
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: COGNITO_CLIENT_ID,
    code,
    code_verifier: verifier,
    redirect_uri: redirectUri,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) throw new Error('Token exchange failed');
  const json = await res.json();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (json.expires_in || 3600);
  localStorage.setItem('id_token', json.id_token);
  localStorage.setItem('access_token', json.access_token);
  localStorage.setItem('refresh_token', json.refresh_token || '');
  localStorage.setItem('token_expires_at', String(expiresAt));
}

export function getSession(): { idToken?: string; accessToken?: string } {
  const idToken = localStorage.getItem('id_token') || undefined;
  const accessToken = localStorage.getItem('access_token') || undefined;
  return { idToken, accessToken };
}

export async function refreshTokens(): Promise<boolean> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) return false;
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: COGNITO_CLIENT_ID,
    refresh_token: refreshToken,
  });
  const res = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });
  if (!res.ok) return false;
  const json = await res.json();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + (json.expires_in || 3600);
  if (json.id_token) localStorage.setItem('id_token', json.id_token);
  if (json.access_token) localStorage.setItem('access_token', json.access_token);
  localStorage.setItem('token_expires_at', String(expiresAt));
  return true;
}

export function scheduleRefresh(): void {
  const exp = Number(localStorage.getItem('token_expires_at') || '0');
  if (!exp) return;
  const msLeft = exp * 1000 - Date.now() - 60000; // refresh 60s early
  if (msLeft <= 0) return;
  setTimeout(async () => {
    try { await refreshTokens(); } catch {}
    scheduleRefresh();
  }, msLeft);
}

export function signOut(): void {
  localStorage.removeItem('id_token');
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('token_expires_at');
  const redirectUri = `${window.location.origin}/`;
  const params = new URLSearchParams({ client_id: COGNITO_CLIENT_ID, logout_uri: redirectUri });
  window.location.href = `https://${COGNITO_DOMAIN}/logout?${params.toString()}`;
}


