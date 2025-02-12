export interface AuthResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    walletAddress?: string;
    isKYCVerified: boolean;
    isEmailVerified: boolean;
  };
  token: string;
}
