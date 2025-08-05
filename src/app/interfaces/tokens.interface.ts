export interface RefreshTokenResponse {
  accessToken: string;
  tokenType: string;
  expiresIn?: string;
}

export interface TokenPayload {
  exp: number;
  iat: number;
  email: string;
  userId: string;
}