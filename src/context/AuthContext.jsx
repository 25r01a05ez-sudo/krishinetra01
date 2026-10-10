import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { request, jsonRequest } from '../services/api';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    let active = true;
    // Remove legacy browser-only passwords and unscoped live scan copies.
    for (const key of ['krishinetra.auth.users', 'krishinetra.auth.currentUser', 'krishinetra.history.v1']) localStorage.removeItem(key);
    request('/api/auth/me').then(r => { if (active) setUser(r.user); }).catch(() => {})
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, []);
  const authenticate = useCallback(async (path, data) => {
    try { const result = await jsonRequest(path, 'POST', data); setUser(result.user); return { success: true, user: result.user }; }
    catch (e) { return { success: false, error: e.message }; }
  }, []);
  const register = useCallback((name, email, password) => authenticate('/api/auth/register', { name, email, password }), [authenticate]);
  const login = useCallback((email, password) => authenticate('/api/auth/login', { email, password }), [authenticate]);
  const verifyOtp = useCallback((email, code) => authenticate('/api/auth/verify-otp', { email, code }), [authenticate]);
  const logout = useCallback(async () => {
    try { await jsonRequest('/api/auth/logout', 'POST', {}); setUser(null); return true; }
    catch (e) { window.alert(`Could not sign out: ${e.message}`); return false; }
  }, []);
  const updateProfile = useCallback(async (updates) => {
    try { const result = await jsonRequest('/api/auth/me', 'PATCH', updates); setUser(result.user); return { success: true }; }
    catch (e) { return { success: false, error: e.message }; }
  }, []);
  const value = useMemo(() => ({ user, isAuthenticated: !!user, isLoading, login, register, logout, verifyOtp, updateProfile }),
    [user, isLoading, login, register, logout, verifyOtp, updateProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { return useContext(AuthContext); }
