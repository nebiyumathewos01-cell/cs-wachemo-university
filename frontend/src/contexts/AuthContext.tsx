import React, { createContext, useContext, useEffect, useReducer, useCallback } from "react";
import type { AuthState, User, LoginCredentials, RegisterData } from "@/types";
import { authApi } from "@/api/auth";
import { AxiosError } from "axios";

// ─── State & Actions ─────────────────────────────────────────

type AuthAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_USER"; payload: User }
  | { type: "LOGOUT" };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("access_token"),
  isAuthenticated: false,
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_USER":
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        isLoading: false,
      };
    case "LOGOUT":
      return {
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      };
    default:
      return state;
  }
}

// ─── Context type ────────────────────────────────────────────

interface AuthContextType extends AuthState {
  /** Returns the authenticated user so callers can read the role immediately. */
  login: (credentials: LoginCredentials) => Promise<User>;
  /** Returns the newly created user. */
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  /** Update the stored user object (e.g. after year selection). */
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Rehydrate session from stored token on first mount
  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      dispatch({ type: "SET_LOADING", payload: false });
      return;
    }
    authApi
      .me()
      .then((res) => {
        dispatch({ type: "SET_USER", payload: res.data });
      })
      .catch(() => {
        localStorage.removeItem("access_token");
        dispatch({ type: "LOGOUT" });
      });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    const res = await authApi.login(credentials);
    const { access_token, user } = res.data;
    localStorage.setItem("access_token", access_token);
    dispatch({ type: "SET_USER", payload: user });
    return user; // Return user so callers can check role immediately
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<User> => {
    const res = await authApi.register(data);
    const { access_token, user } = res.data;
    localStorage.setItem("access_token", access_token);
    dispatch({ type: "SET_USER", payload: user });
    return user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout errors — still clear local state
    } finally {
      localStorage.removeItem("access_token");
      dispatch({ type: "LOGOUT" });
    }
  }, []);

  const updateUser = useCallback((user: User) => {
    dispatch({ type: "SET_USER", payload: user });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}

// ─── Error helper ────────────────────────────────────────────

export function getErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      // Pydantic validation errors: [{loc, msg, type}]
      return detail.map((d: { msg?: string }) => d.msg ?? String(d)).join(", ");
    }
    return error.message;
  }
  if (error instanceof Error) return error.message;
  return "An unexpected error occurred. Please try again.";
}
