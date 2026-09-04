export type AuthCallback = {
  accessToken: string | null;
  refreshToken: string | null;
  code: string | null;
};

export function parseAuthCallbackUrl(url: string): AuthCallback {
  const hashIndex = url.indexOf('#');
  const normalizedUrl =
    hashIndex >= 0
      ? `${url.slice(0, hashIndex)}${url.includes('?') ? '&' : '?'}${url.slice(hashIndex + 1)}`
      : url;
  const params = new URL(normalizedUrl).searchParams;

  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    code: params.get('code'),
  };
}
