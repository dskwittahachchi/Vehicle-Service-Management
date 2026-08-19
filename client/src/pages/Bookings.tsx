import { ArrowRight, CalendarDays, Car, Check, ChevronRight, Clock3, Filter, MapPin, Plus, Search, UserRound, Wrench } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { api } from "../api";
import { EmptyState, ErrorState, LoadingState, Modal, PageHeader, ServiceTimeline, StatusBadge, Toast, formatDate } from "../components/ui";
import type { Booking, Role, User, Vehicle } from "../types";

const newBooking = { vehicleId: "", date: "2026-09-08", time: "09:00", serviceType: "Full service", complaint: "" };

export function Bookings({ role }: { role: Role }) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bookingModal, setBookingModal] = useState(false);
  const [assignModal, setAssignModal] = useState(false);
  const [form, setForm] = useState(newBooking);
  const [assignment, setAssignment] = useState({ technicianId: "", bay: "Bay 01" });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const [bookingResult, vehicleResult, technicianResult] = await Promise.all([
        api.bookings(),
        role === "customer" || role === "admin" ? api.vehicles() : Promise.resolve({ data: [] as Vehicle[] }),
        role === "admin" ? api.technicians() : Promise.resolve({ data: [] as User[] }),
      ]);
      setBookings(bookingResult.data);
      setVehicles(vehicleResult.data);
      setTechnicians(technicianResult.data);
      setSelectedId((current) => current || bookingResult.data[0]?.id || "");
      if (role === "admin" && technicianResult.data[0]) setAssignment((current) => ({ ...current, technicianId: technicianResult.data[0].id }));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load bookings"); } finally { setLoading(false); }
  }, [role]);
  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => bookings.filter((booking) => {
    const query = search.toLowerCase();
    const matchesSearch = !query || `${booking.vehicle?.make} ${booking.vehicle?.model} ${booking.vehicle?.plateNumber} ${booking.serviceType}`.toLowerCase().includes(query);
    return matchesSearch && (status === "all" || booking.status === status);
  }), [bookings, search, status]);
  const selected = bookings.find((booking) => booking.id === selectedId) ?? filtered[0];

  const submitBooking = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const result = await api.createBooking({ vehicleId: form.vehicleId, scheduledAt: new Date(`${form.date}T${form.time}:00`).toISOString(), serviceType: form.serviceType, complaint: form.complaint });
      setBookings((current) => [result.data, ...current]); setSelectedId(result.data.id); setBookingModal(false); setForm(newBooking); setToast(result.message);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to create booking"); } finally { setSaving(false); }
  };

  const submitAssignment = async (event: FormEvent) => {
    event.preventDefault(); if (!selected) return; setSaving(true); setError("");
    try {
      const result = await api.assignBooking(selected.id, assignment.technicianId, assignment.bay);
      setBookings((current) => current.map((booking) => booking.id === selected.id ? result.data : booking)); setAssignModal(false); setToast(result.message);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to assign technician"); } finally { setSaving(false); }
  };

  if (loading) return <LoadingState label="Loading service schedule" />;
  if (error && !bookingModal && !assignModal) return <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />;

  const pageCopy = {
    customer: { eyebrow: "Service care", title: "Service bookings", detail: "Book, review and track every vehicle appointment." },
    technician: { eyebrow: "Assigned schedule", title: "My appointments", detail: "The service bookings connected to your work orders." },
    admin: { eyebrow: "Workshop schedule", title: "Bookings & assignments", detail: "Coordinate arrivals, technicians and workshop bays." },
  }[role];

  return (
    <div className="page-stack">
      <PageHeader {...pageCopy} action={role === "customer" ? <button className="button button--primary" type="button" onClick={() => { setForm({ ...newBooking, vehicleId: vehicles[0]?.id ?? "" }); setBookingModal(true); }}><Plus size={17} />Book service</button> : undefined} />
      <section className="filter-bar"><div className="filter-search"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search vehicle or service" aria-label="Search bookings" /></div><label className="filter-select"><Filter size={15} /><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status"><option value="all">All statuses</option><option value="booked">Booked</option><option value="awaiting_approval">Awaiting approval</option><option value="in_progress">In progress</option><option value="ready">Ready</option><option value="completed">Completed</option></select></label><span className="result-count">{filtered.length} booking{filtered.length === 1 ? "" : "s"}</span></section>

      {filtered.length ? <section className="master-detail booking-layout"><div className="master-list">{filtered.map((booking) => <button type="button" className={selected?.id === booking.id ? "is-selected" : ""} key={booking.id} onClick={() => setSelectedId(booking.id)}><span className="master-list__date"><strong>{new Date(booking.scheduledAt).getDate()}</strong>{new Intl.DateTimeFormat("en-US", { month: "short" }).format(new Date(booking.scheduledAt))}</span><div className="master-list__body"><div><strong>{booking.vehicle?.make} {booking.vehicle?.model}</strong><span>{booking.vehicle?.plateNumber}</span></div><p>{booking.serviceType}</p><StatusBadge status={booking.status} /></div><ChevronRight size={17} /></button>)}</div>{selected && <BookingDetail booking={selected} role={role} onAssign={() => { setAssignment({ technicianId: selected.workOrder?.technicianId ?? technicians[0]?.id ?? "", bay: selected.workOrder?.bay ?? "Bay 01" }); setAssignModal(true); }} />}</section> : <EmptyState icon={CalendarDays} title="No matching bookings" detail="Try a different search or status filter." />}

      {bookingModal && <Modal title="Book a service appointment" detail="Choose a vehicle and preferred workshop time." onClose={() => { setBookingModal(false); setError(""); }}><form className="modal-form" onSubmit={submitBooking}><div className="form-grid"><label className="form-span-2">Vehicle<select value={form.vehicleId} onChange={(event) => setForm({ ...form, vehicleId: event.target.value })} required><option value="">Select a vehicle</option>{vehicles.map((vehicle) => <option key={vehicle.id} value={vehicle.id}>{vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.plateNumber}</option>)}</select></label><label>Preferred date<input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></label><label>Preferred time<input type="time" value={form.time} onChange={(event) => setForm({ ...form, time: event.target.value })} required /></label><label className="form-span-2">Service type<select value={form.serviceType} onChange={(event) => setForm({ ...form, serviceType: event.target.value })}><option>Full service</option><option>Diagnostics</option><option>Brake service</option><option>Wheel alignment</option><option>Annual service</option></select></label><label className="form-span-2">Describe the issue<textarea value={form.complaint} onChange={(event) => setForm({ ...form, complaint: event.target.value })} placeholder="Tell the service team what you have noticed..." minLength={10} rows={4} required /></label></div>{error && <div className="form-error">{error}</div>}<div className="modal__actions"><button className="button button--secondary" type="button" onClick={() => setBookingModal(false)}>Cancel</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? <span className="spinner spinner--light" /> : <>Confirm booking <ArrowRight size={16} /></>}</button></div></form></Modal>}

      {assignModal && selected && <Modal title="Assign technician and bay" detail={`${selected.vehicle?.make} ${selected.vehicle?.model} · ${selected.serviceType}`} onClose={() => { setAssignModal(false); setError(""); }}><form className="modal-form" onSubmit={submitAssignment}><label>Technician<select value={assignment.technicianId} onChange={(event) => setAssignment({ ...assignment, technicianId: event.target.value })} required>{technicians.map((technician) => <option value={technician.id} key={technician.id}>{technician.name}</option>)}</select></label><label>Workshop bay<select value={assignment.bay} onChange={(event) => setAssignment({ ...assignment, bay: event.target.value })}><option>Bay 01</option><option>Bay 02</option><option>Bay 03</option><option>Bay 04</option><option>Bay 05</option></select></label>{error && <div className="form-error">{error}</div>}<div className="modal__actions"><button className="button button--secondary" type="button" onClick={() => setAssignModal(false)}>Cancel</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? <span className="spinner spinner--light" /> : <>Assign work <Check size={16} /></>}</button></div></form></Modal>}
      {toast && <Toast message={toast} tone="success" onClose={() => setToast("")} />}
    </div>
  );
}

function BookingDetail({ booking, role, onAssign }: { booking: Booking; role: Role; onAssign: () => void }) {
  return <article className="detail-panel"><div className="detail-panel__hero"><div><p className="eyebrow">{booking.workOrder?.id?.toUpperCase() ?? "Booking request"}</p><h2>{booking.vehicle?.year} {booking.vehicle?.make} {booking.vehicle?.model}</h2><span>{booking.vehicle?.plateNumber} · {booking.vehicle?.mileage.toLocaleString()} km</span></div><StatusBadge status={booking.status} /></div><ServiceTimeline status={booking.status} /><div className="detail-facts"><div><CalendarDays size={16} /><span><small>Appointment</small><strong>{formatDate(booking.scheduledAt, true)}</strong></span></div><div><Wrench size={16} /><span><small>Service</small><strong>{booking.serviceType}</strong></span></div><div><UserRound size={16} /><span><small>Technician</small><strong>{booking.workOrder?.technician?.name ?? "Not assigned"}</strong></span></div><div><MapPin size={16} /><span><small>Location</small><strong>{booking.workOrder?.bay ?? "Bay pending"}</strong></span></div></div><section className="detail-section"><p className="eyebrow">Customer concern</p><p>{booking.complaint}</p></section>{booking.workOrder?.findings && <section className="detail-section"><p className="eyebrow">Inspection findings</p><p>{booking.workOrder.findings}</p></section>}{booking.workOrder?.estimate && <section className="detail-callout"><div><strong>Estimate {booking.workOrder.estimate.id.replace("est_", "EST-")}</strong><span>{booking.workOrder.estimate.lineItems.length} recommended items</span></div><StatusBadge status={booking.workOrder.estimate.approvalStatus} /></section>}{role === "admin" && <div className="detail-panel__actions"><button className="button button--secondary" type="button" onClick={onAssign}><UserRound size={16} />{booking.workOrder ? "Reassign technician" : "Assign technician"}</button></div>}</article>;
}
