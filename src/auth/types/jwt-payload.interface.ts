export interface JwtPayload {
  sub: string; // user id
  email: string;
  roles: string[];
  type: 'access' | 'refresh';
  jti?: string;
}

export interface AccessTokenPayload extends Omit<JwtPayload, 'type'> {
  type: 'access';
}

export interface RefreshTokenPayload extends Omit<JwtPayload, 'type'> {
  type: 'refresh';
}
