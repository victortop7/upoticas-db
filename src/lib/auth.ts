import { api } from './api';
import type { AuthState } from '../types';

export async function getMe(): Promise<AuthState | null> {
  try {
    const data = await api.get<AuthState>('/auth/me');
    return data;
  } catch {
    return null;
  }
}

export async function login(email: string, senha: string): Promise<AuthState> {
  return api.post<AuthState>('/auth/login', { email, senha });
}

export async function register(data: {
  nome_otica: string;
  nome: string;
  email: string;
  senha: string;
}): Promise<AuthState> {
  return api.post<AuthState>('/auth/register', data);
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout', {});
}
