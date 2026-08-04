/* eslint-disable react-refresh/only-export-components */
// Provider and hook are co-located, as in AuthContext.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { employerApi, type Company, type EmployerAccount } from './hiring';

/**
 * Employer session, kept entirely separate from the learner session. Both can
 * exist in the same browser at once (a Soft Reset School learner who also
 * hires is not a contradiction) and neither can be mistaken for the other:
 * different cookie, different context, different provider.
 *
 * There is no token in this file. The session lives in an httpOnly cookie the
 * API sets, so the only way to know whether one exists is to ask the API —
 * which is what the mount effect does.
 */
interface EmployerAuthState {
  employer: EmployerAccount | null;
  company: Company | null;
  loading: boolean;
  error: string | null;
}

interface EmployerAuthValue extends EmployerAuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (data: { email: string; password: string; name: string; jobTitle?: string }) => Promise<void>;
  logout: () => void;
  setCompany: (company: Company) => void;
  clearError: () => void;
}

const EmployerAuthContext = createContext<EmployerAuthValue | null>(null);

export function EmployerAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<EmployerAuthState>({
    employer: null,
    company: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // A 401 here just means "no employer session in this browser", which is
    // the common case — every learner-only visitor hits it.
    employerApi
      .me()
      .then(({ employer, company }) =>
        setState({ employer, company, loading: false, error: null }),
      )
      .catch(() => setState({ employer: null, company: null, loading: false, error: null }));
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await employerApi.login({ email, password });
      setState({ employer: res.employer, company: res.company, loading: false, error: null });
    } catch (err) {
      setState((s) => ({
        ...s,
        loading: false,
        error: (err as Error).message || 'Could not sign in',
      }));
      throw err;
    }
  }, []);

  const signup = useCallback(
    async (data: { email: string; password: string; name: string; jobTitle?: string }) => {
      setState((s) => ({ ...s, loading: true, error: null }));
      try {
        const res = await employerApi.signup(data);
        setState({ employer: res.employer, company: res.company, loading: false, error: null });
      } catch (err) {
        setState((s) => ({
          ...s,
          loading: false,
          error: (err as Error).message || 'Could not create the account',
        }));
        throw err;
      }
    },
    [],
  );

  const logout = useCallback(() => {
    // The cookie is httpOnly, so only the server can clear it.
    employerApi.logout().catch(() => {});
    setState({ employer: null, company: null, loading: false, error: null });
  }, []);

  // Creating a company reissues the session cookie server-side (the token
  // carries the company id); the client only has to catch up its own state.
  const setCompany = useCallback((company: Company) => {
    setState((s) => ({ ...s, company }));
  }, []);

  const clearError = useCallback(() => setState((s) => ({ ...s, error: null })), []);

  return (
    <EmployerAuthContext.Provider
      value={{ ...state, login, signup, logout, setCompany, clearError }}
    >
      {children}
    </EmployerAuthContext.Provider>
  );
}

export function useEmployerAuth(): EmployerAuthValue {
  const ctx = useContext(EmployerAuthContext);
  if (!ctx) throw new Error('useEmployerAuth must be used within an EmployerAuthProvider');
  return ctx;
}
