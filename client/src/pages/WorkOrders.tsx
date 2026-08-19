import { ArrowRight, Check, CheckCircle2, ClipboardCheck, Clock3, Filter, Search, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, Toast, formatDate, formatMoney, serviceSteps, titleCase } from "../components/ui";
import type { Role, ServiceStatus, WorkOrder } from "../types";

export function WorkOrders({ role }: { role: Role }) {
  const [orders, setOrders] = useState<WorkOrder[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [findings, setFindings] = useState("");

  const load = useCallback(async () => {
    setError("");
    try { const result = await api.workOrders(); setOrders(result.data); setSelectedId((current) => current || result.data[0]?.id || ""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load work orders"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => orders.filter((order) => {
    const query = search.toLowerCase();
    const source = `${order.id} ${order.booking?.vehicle?.make} ${order.booking?.vehicle?.model} ${order.booking?.vehicle?.plateNumber}`.toLowerCase();
    return (!query || source.includes(query)) && (status === "all" || order.status === status);
  }), [orders, search, status]);
  const selected = orders.find((order) => order.id === selectedId) ?? filtered[0];
  useEffect(() => { setFindings(selected?.findings ?? ""); }, [selected]);

  const replaceOrder = (updated: WorkOrder) => setOrders((current) => current.map((order) => order.id === updated.id ? updated : order));
  const toggleTask = async (taskId: string, complete: boolean) => {
    if (!selected) return; setBusy(true);
    try { const result = await api.updateTask(selected.id, taskId, complete); replaceOrder(result.data); setToast(result.message); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update task"); } finally { setBusy(false); }
  };
  const moveNext = async () => {
    if (!selected) return;
    const index = serviceSteps.findIndex((step) => step.status === selected.status);
    const next = serviceSteps[Math.min(index + 1, serviceSteps.length - 1)]?.status;
    if (!next || next === selected.status) return;
    setBusy(true);
    try { const result = await api.updateStatus(selected.id, next, findings); replaceOrder(result.data); setToast(result.message); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to move work order"); } finally { setBusy(false); }
  };

  if (loading) return <LoadingState label="Loading work orders" />;
  if (error && !orders.length) return <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />;

  return <div className="page-stack"><PageHeader eyebrow={role === "admin" ? "Workshop control" : "Technician desk"} title={role === "admin" ? "Work orders" : "My work orders"} detail={role === "admin" ? "Inspect tasks, progress and completion across every active bay." : "Complete approved work and keep service status accurate."} />
    <section className="filter-bar"><div className="filter-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search work order or vehicle" aria-label="Search work orders" /></div><label className="filter-select"><Filter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option>{serviceSteps.map((step) => <option value={step.status} key={step.status}>{step.label}</option>)}</select></label><span className="result-count">{filtered.length} work order{filtered.length === 1 ? "" : "s"}</span></section>
    {filtered.length && selected ? <section className="work-order-layout"><div className="order-list">{filtered.map((order) => { const done = order.tasks.filter((task) => task.complete).length; return <button type="button" key={order.id} className={selected.id === order.id ? "is-selected" : ""} onClick={() => setSelectedId(order.id)}><div className="order-list__top"><span>{order.id.toUpperCase()}</span><StatusBadge status={order.status} /></div><h3>{order.booking?.vehicle?.make} {order.booking?.vehicle?.model}</h3><p>{order.booking?.vehicle?.plateNumber} · {order.booking?.serviceType}</p><div className="order-list__meta"><span><Wrench size={14} /> {order.bay}</span><span><Clock3 size={14} /> {formatDate(order.updatedAt, true)}</span></div><div className="task-meter"><span><i style={{ width: `${order.tasks.length ? (done / order.tasks.length) * 100 : 0}%` }} /></span><small>{done} of {order.tasks.length} tasks</small></div></button>; })}</div><article className="work-order-detail"><div className="work-order-detail__header"><div><p className="eyebrow">{selected.id.toUpperCase()}</p><h2>{selected.booking?.vehicle?.year} {selected.booking?.vehicle?.make} {selected.booking?.vehicle?.model}</h2><span>{selected.booking?.vehicle?.plateNumber} · {selected.booking?.serviceType}</span></div><StatusBadge status={selected.status} /></div><div className="work-order-summary"><div><small>Workshop bay</small><strong>{selected.bay}</strong></div><div><small>Last updated</small><strong>{formatDate(selected.updatedAt, true)}</strong></div><div><small>Estimate</small><strong>{selected.estimate ? formatMoney(selected.estimate.total) : "Not created"}</strong></div></div><section className="task-section"><div className="section-title"><div><p className="eyebrow">Approved work</p><h3>Repair tasks</h3></div><span>{selected.tasks.filter((task) => task.complete).length}/{selected.tasks.length} complete</span></div><div className="task-list">{selected.tasks.map((task) => <label key={task.id} className={task.complete ? "is-complete" : ""}><input type="checkbox" checked={task.complete} disabled={busy || selected.status === "awaiting_approval"} onChange={(event) => void toggleTask(task.id, event.target.checked)} /><span className="task-check">{task.complete && <Check size={14} />}</span><div><strong>{task.name}</strong><small>{titleCase(task.type)} · Qty {task.quantity}</small></div><span>{formatMoney(task.quantity * task.unitPrice)}</span></label>)}</div></section><section className="findings-section"><label>Technician notes<textarea value={findings} onChange={(event) => setFindings(event.target.value)} rows={3} placeholder="Record findings, completed checks or handover notes..." /></label></section>{error && <div className="form-error">{error}</div>}<div className="work-order-detail__actions"><div><CheckCircle2 size={17} /><span>Next stage: <strong>{nextStatus(selected.status)}</strong></span></div><button className="button button--primary" type="button" onClick={() => void moveNext()} disabled={busy || selected.status === "completed" || selected.status === "awaiting_approval"}>{busy ? <span className="spinner spinner--light" /> : <>Move to {nextStatus(selected.status)} <ArrowRight size={16} /></>}</button></div></article></section> : <EmptyState icon={ClipboardCheck} title="No matching work orders" detail="Try a different search or workflow status." />}
    {toast && <Toast message={toast} tone="success" onClose={() => setToast("")} />}
  </div>;
}

function nextStatus(status: ServiceStatus) {
  const index = serviceSteps.findIndex((step) => step.status === status);
  return serviceSteps[Math.min(index + 1, serviceSteps.length - 1)]?.label ?? "Complete";
}
