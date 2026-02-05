import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface SignInParams {
  email: string;
  password: string;
}

export interface SignUpParams {
  email: string;
  password: string;
  name: string;
}

export function useAuth() {
  const navigate = useNavigate();
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const checkSession = useCallback(async () => {
    try {
      const session = await authClient.getSession();
      if (session.data?.user) {
        setState({
          user: {
            id: session.data.user.id,
            email: session.data.user.email,
            name: session.data.user.name,
            avatarUrl: session.data.user.image,
          },
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const signIn = useCallback(
    async ({ email, password }: SignInParams) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const result = await authClient.signIn.email({
          email,
          password,
        });

        if (result.error) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return { success: false, error: result.error.message ?? "ログインに失敗しました" };
        }

        await checkSession();
        navigate({ to: "/" });
        return { success: true, error: null };
      } catch (err) {
        setState((prev) => ({ ...prev, isLoading: false }));
        const message = err instanceof Error ? err.message : "ログインに失敗しました";
        return { success: false, error: message };
      }
    },
    [checkSession, navigate],
  );

  const signUp = useCallback(
    async ({ email, password, name }: SignUpParams) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        const result = await authClient.signUp.email({
          email,
          password,
          name,
        });

        if (result.error) {
          setState((prev) => ({ ...prev, isLoading: false }));
          return { success: false, error: result.error.message ?? "登録に失敗しました" };
        }

        await checkSession();
        navigate({ to: "/" });
        return { success: true, error: null };
      } catch (err) {
        setState((prev) => ({ ...prev, isLoading: false }));
        const message = err instanceof Error ? err.message : "登録に失敗しました";
        return { success: false, error: message };
      }
    },
    [checkSession, navigate],
  );

  const signOut = useCallback(async () => {
    try {
      await authClient.signOut();
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      navigate({ to: "/login" });
    } catch {
      // サーバー側でセッションが既に無効でも、クライアント側の状態はクリア済みなので問題ない
    }
  }, [navigate]);

  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: window.location.origin,
      });
      return { success: true, error: null };
    } catch (err) {
      setState((prev) => ({ ...prev, isLoading: false }));
      const message = err instanceof Error ? err.message : "Googleログインに失敗しました";
      return { success: false, error: message };
    }
  }, []);

  return {
    ...state,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    checkSession,
  };
}
