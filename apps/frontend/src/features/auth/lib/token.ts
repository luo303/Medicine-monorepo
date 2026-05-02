import { AUTH_TOKEN_COOKIE_NAME, AUTH_TOKEN_KEY, AUTH_TOKEN_MAX_AGE } from "@/features/auth/lib/auth-constants";

function buildCookieValue(token: string, maxAge: number): string {
  return `${AUTH_TOKEN_COOKIE_NAME}=${encodeURIComponent(token)}; path=/; max-age=${maxAge}; samesite=lax`;
}

function getTokenFromCookie(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookie = document.cookie.split("; ").find(item => item.startsWith(`${AUTH_TOKEN_COOKIE_NAME}=`));

  if (!cookie) {
    return null;
  }

  return decodeURIComponent(cookie.slice(`${AUTH_TOKEN_COOKIE_NAME}=`.length));
}

export function setToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
  document.cookie = buildCookieValue(token, AUTH_TOKEN_MAX_AGE);
}

export function getToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  const localToken = localStorage.getItem(AUTH_TOKEN_KEY);
  if (localToken) {
    return localToken;
  }

  const cookieToken = getTokenFromCookie();
  if (cookieToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, cookieToken);
  }

  return cookieToken;
}

export function removeToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
  document.cookie = buildCookieValue("", 0);
}
