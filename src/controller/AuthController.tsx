import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { MockDatabase } from '../database/mockDatabase';
import { User } from '../models/userModel';

type SafeUser = Omit<User, 'password'>;
type ProfileUpdates = Partial<Pick<User, 'name' | 'email' | 'cep' | 'cidade' | 'bairro' | 'rua' | 'numero' | 'complemento'>>;
interface AuthContextValue {
  user: SafeUser | null;
  isAuthReady: boolean;
  handleLogin: (email: string, password: string) => Promise<{ success: boolean; message: string; user?: SafeUser }>;
  handleRegister: (name: string, email: string, password: string, profile?: ProfileUpdates) => Promise<{ success: boolean; message: string; user?: SafeUser }>;
  handleLogout: () => Promise<void>;
  updateProfile: (updates: ProfileUpdates) => Promise<SafeUser | null>;
  changePassword: (currentPassword: string, nextPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    let active = true;
    MockDatabase.restoreSession()
      .then((savedUser) => { if (active) setUser(savedUser); })
      .finally(() => { if (active) setIsAuthReady(true); });
    return () => { active = false; };
  }, []);

  const handleLogin: AuthContextValue['handleLogin'] = async (email, password) => {
    const response = await MockDatabase.login(email, password);
    if (response.success) setUser(response.user || null);
    return response;
  };

  const handleRegister: AuthContextValue['handleRegister'] = async (name, email, password, profile = {}) => {
    const response = await MockDatabase.register(name, email, password, 'cliente', profile);
    if (response.success) setUser(response.user || null);
    return response;
  };

  const handleLogout = async () => {
    await MockDatabase.logout();
    setUser(null);
  };

  const updateProfile = async (updates: ProfileUpdates) => {
    if (!user) throw new Error('Entre na sua conta para editar o perfil.');
    const updatedUser = await MockDatabase.updateProfile(user.id, updates);
    if (updatedUser) setUser(updatedUser);
    return updatedUser;
  };

  const changePassword: AuthContextValue['changePassword'] = async (currentPassword, nextPassword) => {
    if (!user) return { success: false, message: 'Entre na sua conta para alterar a senha.' };
    return MockDatabase.changePassword(user.id, currentPassword, nextPassword);
  };

  return <AuthContext.Provider value={{ user, isAuthReady, handleLogin, handleRegister, handleLogout, updateProfile, changePassword }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return context;
}

export default AuthProvider;
