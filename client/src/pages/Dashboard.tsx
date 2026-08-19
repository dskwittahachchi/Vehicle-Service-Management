import { AlertTriangle, ArrowRight, CalendarDays, Car, CheckCircle2, ClipboardCheck, Clock3, FileCheck2, Gauge, Plus, ReceiptText, ShieldCheck, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import type { PageKey } from "../components/AppShell";
import { ErrorState, LoadingState, Metric, PageHeader, ServiceTimeline, StatusBadge, formatDate } from "../components/ui";
import type { Booking, DashboardData, User } from "../types";

export function Dashboard({ user, onNavigate }: { user: User; onNavigate: (page: PageKey) => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      setData((await api.dashboard()).data);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to load the dashboard");
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const active = useMemo(() => data?.bookings.filter((booking) => booking.status !== "completed") ?? [], [data]);
  const featured = active.find((booking) => booking.workOrder) ?? active[0];

  if (!data && !error) return <LoadingState label="Preparing your dashboard" />;
  if (error) return <ErrorState message={error} onRetry={() => void load()} />;
  if (!data) return null;

  const headings = {
    customer: { eyebrow: "Customer portal", title: `Good morning, ${user.name.split(" ")[0]}`, detail: "Your vehicles, appointments and service progress in one place." },
    technician: { eyebrow: "Wednesday, August 19", title: `Ready for your shift, ${user.name.split(" ")[0]}?`, detail: "Review assigned work and keep every bay moving." },
    admin: { eyebrow: "Service operations", title: "Workshop overview", detail: "Live service load, approvals and recent floor activity." },
  }[user.role];

  return (
    <div className="page-stack">
      <PageHeader {...headings} action={user.role === "customer" ? <button className="button button--primary" type="button" onClick={() => onNavigate("bookings")}><Plus size={17} />Book service</button> : <span className="live-indicator"><i /> Live floor data</span>} />

      <section className="metric-grid" aria-label="Key metrics">
        <Metric label={user.role === "technician" ? "Assigned today" : "Active jobs"} value={data.metrics.activeJobs} note={user.role === "customer" ? "Across your vehicles" : "Currently in workflow"} icon={Wrench} tone="red" />
        <Metric label={user.role === "technician" ? "Task completion" : "Vehicles"} value={user.role === "technician" ? `${data.metrics.taskCompletion}%` : data.metrics.vehicles} note={user.role === "technician" ? "Across assigned work" : "Registered in system"} icon={user.role === "technician" ? CheckCircle2 : Car} tone="green" />
        <Metric label="Pending approvals" value={data.metrics.pendingApprovals} note="Awaiting customer decision" icon={FileCheck2} tone="amber" />
        <Metric label={user.role === "technician" ? "Workshop standard" : "Open invoices"} value={user.role === "technician" ? "98%" : data.metrics.unpaidInvoices} note={user.role === "technician" ? "Quality score this month" : "Require follow-up"} icon={user.role === "technician" ? ShieldCheck : ReceiptText} />
      </section>

      {user.role === "customer" && <CustomerOverview featured={featured} active={active} onNavigate={onNavigate} />}
      {user.role === "technician" && <TechnicianOverview bookings={data.bookings} onNavigate={onNavigate} />}
      {user.role === "admin" && <AdminOverview bookings={data.bookings} onNavigate={onNavigate} />}

      <section className="dashboard-lower">
        <div className="panel panel--grow">
          <div className="panel__header"><div><p className="eyebrow">Activity feed</p><h2>Latest workshop updates</h2></div><Clock3 size={19} /></div>
          <div className="activity-list">
            {data.activity.map((activity) => (
              <div className="activity-item" key={activity.id}><span className="activity-item__dot" /><div><strong>{activity.label}</strong><p>{activity.detail}</p></div><time>{formatDate(activity.at, true)}</time></div>
            ))}
          </div>
        </div>
        <aside className="panel attention-panel">
          <div className="attention-panel__icon"><AlertTriangle size={21} /></div>
          <p className="eyebrow">Needs attention</p>
          <h2>{data.metrics.pendingApprovals || 1} estimate{data.metrics.pendingApprovals === 1 ? "" : "s"} waiting</h2>
          <p>Approval delays are the largest risk to today's bay schedule.</p>
          <button className="text-button" type="button" onClick={() => onNavigate("estimates")}>Review estimates <ArrowRight size={15} /></button>
        </aside>
      </section>
    </div>
  );
}

function CustomerOverview({ featured, active, onNavigate }: { featured?: Booking; active: Booking[]; onNavigate: (page: PageKey) => void }) {
  return (
    <section className="customer-overview">
      <div className="panel service-progress">
        <div className="panel__header">
          <div><p className="eyebrow">Current service</p><h2>{featured?.vehicle ? `${featured.vehicle.year} ${featured.vehicle.make} ${featured.vehicle.model}` : "No active service"}</h2></div>
          {featured && <StatusBadge status={featured.status} />}
        </div>
        {featured ? <><div className="service-progress__meta"><span><ClipboardCheck size={15} /> {featured.workOrder?.id?.toUpperCase() ?? "Awaiting assignment"}</span><span><CalendarDays size={15} /> {formatDate(featured.scheduledAt, true)}</span><span><Gauge size={15} /> {featured.workOrder?.bay ?? "Bay pending"}</span></div><ServiceTimeline status={featured.status} /><div className="service-progress__footer"><p>{featured.workOrder?.findings || featured.complaint}</p><button className="text-button" type="button" onClick={() => onNavigate("bookings")}>View details <ArrowRight size={15} /></button></div></> : <div className="compact-empty"><p>Your next active booking will appear here.</p><button className="button button--secondary" type="button" onClick={() => onNavigate("bookings")}>Book service</button></div>}
      </div>
      <div className="panel upcoming-panel">
        <div className="panel__header"><div><p className="eyebrow">Coming up</p><h2>Appointments</h2></div><button className="icon-button" type="button" onClick={() => onNavigate("bookings")} aria-label="Open bookings" title="Open bookings"><ArrowRight size={18} /></button></div>
        <div className="appointment-list">
          {active.slice(0, 3).map((booking) => <div key={booking.id}><time><strong>{new Date(booking.scheduledAt).getDate()}</strong><span>{new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(booking.scheduledAt))}</span></time><div><strong>{booking.serviceType}</strong><p>{booking.vehicle?.make} {booking.vehicle?.model} · {booking.vehicle?.plateNumber}</p></div><StatusBadge status={booking.status} /></div>)}
        </div>
      </div>
    </section>
  );
}

function TechnicianOverview({ bookings, onNavigate }: { bookings: Booking[]; onNavigate: (page: PageKey) => void }) {
  const assigned = bookings.filter((booking) => booking.workOrder);
  return (
    <section className="panel operation-panel">
      <div className="panel__header"><div><p className="eyebrow">Assigned work</p><h2>Today's priority queue</h2></div><button className="button button--secondary" type="button" onClick={() => onNavigate("work")}>Open work orders <ArrowRight size={16} /></button></div>
      <div className="work-queue">
        {assigned.map((booking, index) => <button type="button" key={booking.id} onClick={() => onNavigate("work")}><span className="queue-order">{String(index + 1).padStart(2, "0")}</span><div><strong>{booking.vehicle?.make} {booking.vehicle?.model}</strong><p>{booking.serviceType} · {booking.workOrder?.bay}</p></div><div className="queue-progress"><span><i style={{ width: `${booking.workOrder?.tasks.length ? (booking.workOrder.tasks.filter((task) => task.complete).length / booking.workOrder.tasks.length) * 100 : 0}%` }} /></span><small>{booking.workOrder?.tasks.filter((task) => task.complete).length}/{booking.workOrder?.tasks.length} tasks</small></div><StatusBadge status={booking.status} /><ArrowRight size={16} /></button>)}
      </div>
    </section>
  );
}

function AdminOverview({ bookings, onNavigate }: { bookings: Booking[]; onNavigate: (page: PageKey) => void }) {
  return (
    <section className="panel operation-panel">
      <div className="panel__header"><div><p className="eyebrow">Live schedule</p><h2>Active workshop load</h2></div><button className="button button--secondary" type="button" onClick={() => onNavigate("bookings")}>Manage schedule <ArrowRight size={16} /></button></div>
      <div className="data-table-wrap"><table className="data-table"><thead><tr><th>Work order</th><th>Vehicle</th><th>Service</th><th>Technician / bay</th><th>Status</th></tr></thead><tbody>{bookings.filter((booking) => booking.status !== "completed").map((booking) => <tr key={booking.id}><td><strong>{booking.workOrder?.id?.toUpperCase() ?? "Unassigned"}</strong><span>{formatDate(booking.scheduledAt, true)}</span></td><td><strong>{booking.vehicle?.make} {booking.vehicle?.model}</strong><span>{booking.vehicle?.plateNumber}</span></td><td>{booking.serviceType}</td><td>{booking.workOrder ? <><strong>{booking.workOrder.technician?.name}</strong><span>{booking.workOrder.bay}</span></> : <button className="text-button" type="button" onClick={() => onNavigate("bookings")}>Assign now</button>}</td><td><StatusBadge status={booking.status} /></td></tr>)}</tbody></table></div>
    </section>
  );
}
