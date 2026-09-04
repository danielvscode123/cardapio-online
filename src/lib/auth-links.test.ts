import { describe, expect, it } from 'vitest';

import { parseAuthCallbackUrl } from './auth-callback';

describe('parseAuthCallbackUrl', () => {
  it('reads tokens returned in the URL fragment', () => {
    expect(parseAuthCallbackUrl('mesaboa://activation#access_token=access&refresh_token=refresh')).toEqual({
      accessToken: 'access',
      refreshToken: 'refresh',
      code: null,
    });
  });

  it('reads a PKCE authorization code from the query string', () => {
    expect(parseAuthCallbackUrl('mesaboa://activation?code=auth-code')).toEqual({
      accessToken: null,
      refreshToken: null,
      code: 'auth-code',
    });
  });
});
