import {
  Bell,
  CalendarDays,
  Car,
  ChevronDown,
  ClipboardCheck,
  FileText,
  Gauge,
  LogOut,
  Menu,
  PanelLeftClose,
  ReceiptText,
  Wrench,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import type { Role, User } from "../types";

export type PageKey = "dashboard" | "vehicles" | "bookings" | "work" | "estimates" | "invoices";

const roleLabels: Record<Role, string> = { customer: "Customer portal", technician: "Technician desk", admin: "Service operations" };

const navigation: Record<Role, Array<{ key: PageKey; label: string; icon: typeof Gauge }>> = {
  customer: [
    { key: "dashboard", label: "Overview", icon: Gauge },
    { key: "vehicles", label: "My vehicles", icon: Car },
    { key: "bookings", label: "Service bookings", icon: CalendarDays },
    { key: "estimates", label: "Estimates", icon: FileText },
    { key: "invoices", label: "Invoices", icon: ReceiptText },
  ],
  technician: [
    { key: "dashboard", label: "Shift overview", icon: Gauge },
    { key: "work", label: "My work orders", icon: ClipboardCheck },
    { key: "bookings", label: "Schedule", icon: CalendarDays },
  ],
  admin: [
    { key: "dashboard", label: "Operations", icon: Gauge },
    { key: "bookings", label: "Schedule", icon: CalendarDays },
    { key: "work", label: "Work orders", icon: ClipboardCheck },
    { key: "estimates", label: "Estimates", icon: FileText },
    { key: "invoices", label: "Invoices", icon: ReceiptText },
  ],
};

export function AppShell({ user, page, onPageChange, onLogout, children }: { user: User; page: PageKey; onPageChange: (page: PageKey) => void; onLogout: () => void; children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const initials = useMemo(() => user.name.split(" ").map((part) => part[0]).slice(0, 2).join(""), [user.name]);

  const selectPage = (nextPage: PageKey) => {
    onPageChange(nextPage);
    setMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? "is-open" : ""}`}>
        <div className="brand">
          <span className="brand__mark"><Wrench size={20} /></span>
          <div><strong>AutoServe</strong><span>Vehicle care</span></div>
          <button className="icon-button sidebar__close" type="button" onClick={() => setMenuOpen(false)} aria-label="Close navigation" title="Close navigation"><PanelLeftClose size={18} /></button>
        </div>
        <div className="sidebar__context"><span>Workspace</span><strong>{roleLabels[user.role]}</strong></div>
        <nav className="nav-list" aria-label="Main navigation">
          {navigation[user.role].map((item) => {
            const Icon = item.icon;
            return <button key={item.key} type="button" className={page === item.key ? "is-active" : ""} onClick={() => selectPage(item.key)}><Icon size={18} /><span>{item.label}</span></button>;
          })}
        </nav>
        <div className="sidebar__bottom">
          <div className="support-status"><span /><div><strong>Service desk online</strong><p>Avg. reply 4 min</p></div></div>
        </div>
      </aside>
      {menuOpen && <button type="button" className="sidebar-scrim" onClick={() => setMenuOpen(false)} aria-label="Close navigation" />}

      <div className="workspace">
        <header className="topbar">
          <button className="icon-button mobile-menu" type="button" onClick={() => setMenuOpen(true)} aria-label="Open navigation" title="Open navigation"><Menu size={20} /></button>
          <div className="topbar__date"><span>Today</span><strong>Wed, Aug 19</strong></div>
          <div className="topbar__actions">
            <button className="icon-button notification-button" type="button" aria-label="Notifications" title="Notifications"><Bell size={19} /><span /></button>
            <div className="profile-menu">
              <button className="profile-trigger" type="button" onClick={() => setProfileOpen((open) => !open)} aria-expanded={profileOpen}>
                <span className="avatar">{initials}</span>
                <span className="profile-trigger__text"><strong>{user.name}</strong><small>{roleLabels[user.role]}</small></span>
                <ChevronDown size={15} />
              </button>
              {profileOpen && (
                <div className="profile-popover">
                  <div><strong>{user.name}</strong><span>{user.email}</span></div>
                  <button type="button" onClick={onLogout}><LogOut size={16} />Sign out</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="main-content">{children}</main>
      </div>
    </div>
  );
}
