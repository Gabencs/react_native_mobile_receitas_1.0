import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthResponse } from '../models/userModel';

const USERS_KEY = '@cardapio-nativo/users-v1';
const SESSION_KEY = '@cardapio-nativo/session-v1';
const delay = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));
const seedUsers: User[] = [
  { id: '1', name: 'Admin Teste', email: 'admin@fogo.com', password: '123', role: 'admin', createdAt: new Date().toISOString() },
  { id: '2', name: 'Cliente Exemplo', email: 'cliente@fogo.com', password: '123', role: 'cliente', createdAt: new Date().toISOString() },
];

type UserProfile = Partial<Pick<User, 'name' | 'email' | 'cep' | 'cidade' | 'bairro' | 'rua' | 'numero' | 'complemento'>>;

async function readUsers(): Promise<User[]> {
  const raw = await AsyncStorage.getItem(USERS_KEY);
  if (raw) {
    try { return JSON.parse(raw) as User[]; } catch { await AsyncStorage.removeItem(USERS_KEY); }
  }
  await AsyncStorage.setItem(USERS_KEY, JSON.stringify(seedUsers));
  return seedUsers;
}

async function saveSession(user: User | null) {
  if (!user) return AsyncStorage.removeItem(SESSION_KEY);
  const { password: _password, ...safeUser } = user;
  return AsyncStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
}

function withoutPassword(user: User) {
  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export const MockDatabase = {
  async login(email: string, password: string): Promise<AuthResponse> {
    await delay();
    const users = await readUsers();
    const user = users.find((entry) => entry.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) return { success: false, message: 'Não encontramos uma conta com este e-mail.' };
    if (user.password !== password) return { success: false, message: 'A senha informada está incorreta.' };
    await saveSession(user);
    return { success: true, message: 'Login efetuado com sucesso!', user: withoutPassword(user), token: `local-session-${user.id}` };
  },

  async register(name: string, email: string, password: string, role: 'admin' | 'cliente' | 'cozinha' = 'cliente', profile: UserProfile = {}): Promise<AuthResponse> {
    await delay();
    const users = await readUsers();
    const emailFormatted = email.toLowerCase().trim();
    if (users.some((user) => user.email.toLowerCase() === emailFormatted)) {
      return { success: false, message: 'Este e-mail já está cadastrado.' };
    }
    const newUser: User = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: name.trim(),
      email: emailFormatted,
      password,
      role,
      createdAt: new Date().toISOString(),
      ...profile,
    };
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify([...users, newUser]));
    await saveSession(newUser);
    return { success: true, message: 'Cadastro realizado com sucesso!', user: withoutPassword(newUser), token: `local-session-${newUser.id}` };
  },

  async restoreSession(): Promise<Omit<User, 'password'> | null> {
    try {
      const raw = await AsyncStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) as Omit<User, 'password'> : null;
    } catch { return null; }
  },

  async updateProfile(userId: string, updates: UserProfile): Promise<Omit<User, 'password'> | null> {
    const users = await readUsers();
    const index = users.findIndex((user) => user.id === userId);
    if (index < 0) return null;
    const nextEmail = updates.email?.toLowerCase().trim();
    if (nextEmail && users.some((user, i) => i !== index && user.email.toLowerCase() === nextEmail)) {
      throw new Error('Este e-mail já está sendo usado por outra conta.');
    }
    users[index] = { ...users[index], ...updates, email: nextEmail || users[index].email };
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    await saveSession(users[index]);
    return withoutPassword(users[index]);
  },

  async changePassword(userId: string, currentPassword: string, nextPassword: string): Promise<{ success: boolean; message: string }> {
    await delay();
    const users = await readUsers();
    const index = users.findIndex((user) => user.id === userId);
    if (index < 0) return { success: false, message: 'Conta não encontrada.' };
    if (users[index].password !== currentPassword) return { success: false, message: 'A senha atual está incorreta.' };
    if (nextPassword.trim().length < 6) return { success: false, message: 'A nova senha precisa ter pelo menos 6 caracteres.' };
    users[index] = { ...users[index], password: nextPassword };
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
    await saveSession(users[index]);
    return { success: true, message: 'Senha alterada com sucesso neste dispositivo.' };
  },

  async logout() { await AsyncStorage.removeItem(SESSION_KEY); },
};
