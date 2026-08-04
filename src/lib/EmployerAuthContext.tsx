/* eslint-disable react-refresh/only-export-components */
// Provider and hook are co-located, as in AuthContext.
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { employerApi, EMPLOYER_TOKEN_KEY, type Company, type EmployerAccount } from './hiring';

/**
 * Employer session, kept entirely separate from the learner session. Both can
 * exist in the same browser at once (a Soft Reset School learner who also
 * hires is not a contradiction) and neither can be mistaken for the other:
 * different token key, different context, different provider.
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
    const token = localStorage.getItem(EMPLOYER_TOKEN_KEY);
    if (!token) {
      setState({ employer: null, company: null, loading: false, error: null });
      return;
    }
    employerApi
      .me()
      .then(({ employer, company }) =>
        setState({ employer, company, loading: false, error: null }),
      )
      .catch(() => {
        localStorage.removeItem(EMPLOYER_TOKEN_KEY);
        setState({ employer: null, company: null, loading: false, error: null });
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await employerApi.login({ email, password });
      localStorage.setItem(EMPLOYER_TOKEN_KEY, res.token);
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
        localStorage.setItem(EMPLOYER_TOKEN_KEY, res.token);
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
    employerApi.logout().catch(() => {});
    localStorage.removeItem(EMPLOYER_TOKEN_KEY);
    setState({ employer: null, company: null, loading: false, error: null });
  }, []);

  // Creating a company reissues the token (it carries the company id), so the
  // stored token has to be replaced too or company-gated calls keep failing.
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
