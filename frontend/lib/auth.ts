export interface AuthSession {
  token: string;
  factoryId: number;
  factoryName: string;
  userId: number;
  fullName: string | null;
  role: string;
}

export function saveSession(session: AuthSession) {
  localStorage.setItem("auth_token", session.token);
  localStorage.setItem("auth_session", JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("auth_session");
  return raw ? JSON.parse(raw) : null;
}

export function clearSession() {
  localStorage.removeItem("auth_token");
  localStorage.removeItem("auth_session");
}

export function isLoggedIn(): boolean {
  return !!getSession();
}
