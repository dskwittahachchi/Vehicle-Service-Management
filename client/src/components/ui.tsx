import type { LucideIcon } from "lucide-react";
import { AlertCircle, Check, X } from "lucide-react";
import type { ReactNode } from "react";
import type { ServiceStatus } from "../types";

export const formatMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
export const formatDate = (value: string, withTime = false) => new Intl.DateTimeFormat("en-US", withTime ? { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" } : { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
export const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export function StatusBadge({ status }: { status: string }) {
  return <span className={`status status--${status}`}>{titleCase(status)}</span>;
}

export function PageHeader({ eyebrow, title, detail, action }: { eyebrow?: string; title: string; detail: string; action?: ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{detail}</p>
      </div>
      {action && <div className="page-header__actions">{action}</div>}
    </header>
  );
}

export function Metric({ label, value, note, icon: Icon, tone = "neutral" }: { label: string; value: string | number; note: string; icon: LucideIcon; tone?: "neutral" | "red" | "green" | "amber" }) {
  return (
    <div className={`metric metric--${tone}`}>
      <div className="metric__icon"><Icon size={18} strokeWidth={1.8} /></div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <span>{note}</span>
      </div>
    </div>
  );
}

export function Modal({ title, detail, children, onClose, size = "regular" }: { title: string; detail?: string; children: ReactNode; onClose: () => void; size?: "regular" | "wide" }) {
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className={`modal modal--${size}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal__header">
          <div>
            <h2 id="modal-title">{title}</h2>
            {detail && <p>{detail}</p>}
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="Close dialog" title="Close"><X size={19} /></button>
        </div>
        {children}
      </section>
    </div>
  );
}

export function LoadingState({ label = "Loading workspace" }: { label?: string }) {
  return <div className="loading-state"><span className="spinner" aria-hidden="true" /><p>{label}</p></div>;
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="message-state message-state--error">
      <AlertCircle size={22} />
      <div><strong>Something needs attention</strong><p>{message}</p></div>
      {onRetry && <button className="button button--secondary" type="button" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, detail, action }: { icon: LucideIcon; title: string; detail: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <Icon size={28} strokeWidth={1.5} />
      <h3>{title}</h3>
      <p>{detail}</p>
      {action}
    </div>
  );
}

export function Toast({ message, tone, onClose }: { message: string; tone: "success" | "error"; onClose: () => void }) {
  return (
    <div className={`toast toast--${tone}`} role="status">
      {tone === "success" ? <Check size={17} /> : <AlertCircle size={17} />}
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="Dismiss notification" title="Dismiss"><X size={15} /></button>
    </div>
  );
}

export const serviceSteps: Array<{ status: ServiceStatus; label: string }> = [
  { status: "booked", label: "Booked" },
  { status: "inspected", label: "Inspected" },
  { status: "awaiting_approval", label: "Approval" },
  { status: "in_progress", label: "In progress" },
  { status: "ready", label: "Ready" },
  { status: "completed", label: "Complete" },
];

export function ServiceTimeline({ status }: { status: ServiceStatus }) {
  const currentIndex = serviceSteps.findIndex((step) => step.status === status);
  return (
    <ol className="service-timeline" aria-label={`Service status: ${titleCase(status)}`}>
      {serviceSteps.map((step, index) => (
        <li key={step.status} className={index < currentIndex ? "is-complete" : index === currentIndex ? "is-current" : ""}>
          <span>{index < currentIndex ? <Check size={12} /> : index + 1}</span>
          <p>{step.label}</p>
        </li>
      ))}
    </ol>
  );
}
