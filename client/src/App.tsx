import { useEffect, useState } from "react";
import { api } from "./api";
import { AppShell, type PageKey } from "./components/AppShell";
import { LoadingState } from "./components/ui";
import { Bookings } from "./pages/Bookings";
import { Dashboard } from "./pages/Dashboard";
import { Estimates, Invoices } from "./pages/Financials";
import { Login } from "./pages/Login";
import { Vehicles } from "./pages/Vehicles";
import { WorkOrders } from "./pages/WorkOrders";
import type { User } from "./types";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState<PageKey>("dashboard");
  const [checkingSession, setCheckingSession] = useState(Boolean(api.token.get()));

  useEffect(() => {
    if (!api.token.get()) return;
    api.me().then((result) => setUser(result.data)).catch(() => api.token.clear()).finally(() => setCheckingSession(false));
  }, []);

  const login = async (email: string, password: string) => {
    const result = await api.login(email, password);
    api.token.set(result.data.token);
    setUser(result.data.user);
    setPage(result.data.user.role === "technician" ? "work" : "dashboard");
    return result.data.user;
  };

  const logout = () => {
    api.token.clear();
    setUser(null);
    setPage("dashboard");
  };

  if (checkingSession) return <div className="app-loading"><LoadingState label="Restoring your session" /></div>;
  if (!user) return <Login onLogin={login} />;

  return <AppShell user={user} page={page} onPageChange={setPage} onLogout={logout}>
    {page === "dashboard" && <Dashboard user={user} onNavigate={setPage} />}
    {page === "vehicles" && <Vehicles />}
    {page === "bookings" && <Bookings role={user.role} />}
    {page === "work" && <WorkOrders role={user.role} />}
    {page === "estimates" && <Estimates role={user.role} />}
    {page === "invoices" && <Invoices role={user.role} />}
  </AppShell>;
}
