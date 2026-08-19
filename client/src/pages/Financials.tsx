import { Check, FileText, Printer, ReceiptText, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { EmptyState, ErrorState, LoadingState, PageHeader, StatusBadge, Toast, formatDate, formatMoney } from "../components/ui";
import type { Estimate, Invoice, Role } from "../types";

export function Estimates({ role }: { role: Role }) {
  const [estimates, setEstimates] = useState<Estimate[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try { const result = await api.estimates(); setEstimates(result.data); setSelectedId((current) => current || result.data[0]?.id || ""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load estimates"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const selected = estimates.find((estimate) => estimate.id === selectedId) ?? estimates[0];

  const decide = async (decision: "approved" | "rejected") => {
    if (!selected) return; setBusy(true); setError("");
    try { const result = await api.decideEstimate(selected.id, decision); setEstimates((current) => current.map((estimate) => estimate.id === selected.id ? { ...estimate, ...result.data } : estimate)); setToast(result.message); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update estimate"); } finally { setBusy(false); }
  };

  if (loading) return <LoadingState label="Loading estimates" />;
  if (error && !estimates.length) return <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />;

  return <div className="page-stack"><PageHeader eyebrow="Repair authorization" title="Estimates" detail={role === "customer" ? "Review recommended work before the service team proceeds." : "Track estimates from preparation through customer decision."} />
    {estimates.length && selected ? <section className="financial-layout"><div className="financial-list"><div className="financial-list__head"><span>Estimate</span><span>Status</span></div>{estimates.map((estimate) => <button type="button" className={selected.id === estimate.id ? "is-selected" : ""} key={estimate.id} onClick={() => setSelectedId(estimate.id)}><div><strong>{estimate.id.replace("est_", "EST-")}</strong><span>{estimate.workOrder?.booking?.vehicle?.make} {estimate.workOrder?.booking?.vehicle?.model} · {formatDate(estimate.createdAt)}</span></div><div><strong>{formatMoney(estimate.total)}</strong><StatusBadge status={estimate.approvalStatus} /></div></button>)}</div><article className="document-panel"><div className="document-panel__top"><div className="document-brand"><span><FileText size={20} /></span><div><strong>AutoServe</strong><small>Repair estimate</small></div></div><StatusBadge status={selected.approvalStatus} /></div><div className="document-title"><div><p className="eyebrow">Estimate number</p><h2>{selected.id.replace("est_", "EST-")}</h2><span>Prepared {formatDate(selected.createdAt)}</span></div><div><p className="eyebrow">Vehicle</p><strong>{selected.workOrder?.booking?.vehicle?.year} {selected.workOrder?.booking?.vehicle?.make} {selected.workOrder?.booking?.vehicle?.model}</strong><span>{selected.workOrder?.booking?.vehicle?.plateNumber}</span></div></div><div className="document-lines"><div className="document-lines__head"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span></div>{selected.lineItems.map((item) => <div key={item.description}><span>{item.description}</span><span>{item.quantity}</span><span>{formatMoney(item.unitPrice)}</span><strong>{formatMoney(item.quantity * item.unitPrice)}</strong></div>)}</div><div className="document-total"><span>Estimated total</span><strong>{formatMoney(selected.total)}</strong></div>{selected.workOrder?.findings && <div className="document-note"><strong>Inspection note</strong><p>{selected.workOrder.findings}</p></div>}{error && <div className="form-error">{error}</div>}{role === "customer" && selected.approvalStatus === "pending" && <div className="approval-actions"><div><strong>Authorization required</strong><span>Your decision is recorded with this work order.</span></div><button className="button button--danger-quiet" type="button" disabled={busy} onClick={() => void decide("rejected")}><X size={16} />Decline</button><button className="button button--primary" type="button" disabled={busy} onClick={() => void decide("approved")}>{busy ? <span className="spinner spinner--light" /> : <><Check size={16} />Approve estimate</>}</button></div>}</article></section> : <EmptyState icon={FileText} title="No estimates available" detail="Prepared repair estimates will appear here." />}
    {toast && <Toast message={toast} tone="success" onClose={() => setToast("")} />}
  </div>;
}

export function Invoices({ role }: { role: Role }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    try { const result = await api.invoices(); setInvoices(result.data); setSelectedId((current) => current || result.data[0]?.id || ""); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load invoices"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const selected = invoices.find((invoice) => invoice.id === selectedId) ?? invoices[0];

  const markPaid = async () => {
    if (!selected) return; setBusy(true);
    try { const result = await api.updatePayment(selected.id, "paid"); setInvoices((current) => current.map((invoice) => invoice.id === selected.id ? { ...invoice, ...result.data } : invoice)); setToast(result.message); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to update payment"); } finally { setBusy(false); }
  };

  if (loading) return <LoadingState label="Loading invoices" />;
  if (error && !invoices.length) return <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />;

  return <div className="page-stack"><PageHeader eyebrow="Billing" title="Invoices" detail={role === "customer" ? "Review completed service charges and payment status." : "Issue, review and reconcile workshop invoices."} action={selected ? <button className="button button--secondary" type="button" onClick={() => window.print()}><Printer size={16} />Print invoice</button> : undefined} />
    {invoices.length && selected ? <section className="financial-layout"><div className="financial-list"><div className="financial-list__head"><span>Invoice</span><span>Payment</span></div>{invoices.map((invoice) => <button type="button" className={selected.id === invoice.id ? "is-selected" : ""} key={invoice.id} onClick={() => setSelectedId(invoice.id)}><div><strong>{invoice.invoiceNumber}</strong><span>{invoice.workOrder?.booking?.vehicle?.make} {invoice.workOrder?.booking?.vehicle?.model} · {formatDate(invoice.issuedAt)}</span></div><div><strong>{formatMoney(invoice.total)}</strong><StatusBadge status={invoice.paymentStatus} /></div></button>)}</div><article className="document-panel"><div className="document-panel__top"><div className="document-brand"><span><ReceiptText size={20} /></span><div><strong>AutoServe</strong><small>Service invoice</small></div></div><StatusBadge status={selected.paymentStatus} /></div><div className="document-title"><div><p className="eyebrow">Invoice number</p><h2>{selected.invoiceNumber}</h2><span>Issued {formatDate(selected.issuedAt)}</span></div><div><p className="eyebrow">Billed vehicle</p><strong>{selected.workOrder?.booking?.vehicle?.year} {selected.workOrder?.booking?.vehicle?.make} {selected.workOrder?.booking?.vehicle?.model}</strong><span>{selected.workOrder?.booking?.vehicle?.plateNumber}</span></div></div><div className="document-lines"><div className="document-lines__head"><span>Description</span><span>Qty</span><span>Rate</span><span>Amount</span></div>{selected.lineItems.map((item) => <div key={item.description}><span>{item.description}</span><span>{item.quantity}</span><span>{formatMoney(item.unitPrice)}</span><strong>{formatMoney(item.quantity * item.unitPrice)}</strong></div>)}</div><div className="invoice-totals"><div><span>Subtotal</span><strong>{formatMoney(selected.subtotal)}</strong></div><div><span>Tax</span><strong>{formatMoney(selected.tax)}</strong></div><div><span>Total due</span><strong>{formatMoney(selected.total)}</strong></div></div>{error && <div className="form-error">{error}</div>}{role === "admin" && selected.paymentStatus === "unpaid" && <div className="approval-actions"><div><strong>Payment reconciliation</strong><span>Confirm received payments against this invoice.</span></div><button className="button button--primary" type="button" disabled={busy} onClick={() => void markPaid()}>{busy ? <span className="spinner spinner--light" /> : <><Check size={16} />Mark as paid</>}</button></div>}</article></section> : <EmptyState icon={ReceiptText} title="No invoices available" detail="Finalized service invoices will appear here." />}
    {toast && <Toast message={toast} tone="success" onClose={() => setToast("")} />}
  </div>;
}
