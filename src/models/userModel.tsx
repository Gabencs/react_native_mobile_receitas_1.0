export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: 'admin' | 'cliente' | 'cozinha';
  createdAt: string;
  cep?: string;
  cidade?: string;
  bairro?: string;
  rua?: string;
  numero?: string;
  complemento?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  user?: Omit<User, 'password'>;
  token?: string;
}
