import { Car, Gauge, History, KeyRound, Plus } from "lucide-react";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { api } from "../api";
import { EmptyState, ErrorState, LoadingState, Modal, PageHeader, Toast, formatDate } from "../components/ui";
import type { Vehicle } from "../types";

const emptyForm = { make: "", model: "", year: "2024", plateNumber: "", vin: "", mileage: "0", color: "" };

export function Vehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const load = useCallback(async () => {
    setError("");
    try { setVehicles((await api.vehicles()).data); } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to load vehicles"); } finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const result = await api.addVehicle({ ...form, year: Number(form.year), mileage: Number(form.mileage) });
      setVehicles((current) => [...current, result.data]);
      setForm(emptyForm);
      setModalOpen(false);
      setToast(result.message);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to add vehicle"); } finally { setSaving(false); }
  };

  if (loading) return <LoadingState label="Loading your garage" />;
  if (error && !modalOpen) return <ErrorState message={error} onRetry={() => { setLoading(true); void load(); }} />;

  return (
    <div className="page-stack">
      <PageHeader eyebrow="Customer garage" title="My vehicles" detail="Vehicle details, mileage and complete service history." action={<button className="button button--primary" type="button" onClick={() => setModalOpen(true)}><Plus size={17} />Add vehicle</button>} />
      {vehicles.length ? <section className="vehicle-grid">{vehicles.map((vehicle, index) => <article className="vehicle-card" key={vehicle.id}><div className={`vehicle-card__visual vehicle-card__visual--${index % 2}`}><Car size={42} strokeWidth={1.3} /><span>{vehicle.color || "Registered vehicle"}</span></div><div className="vehicle-card__body"><div className="vehicle-card__title"><div><p>{vehicle.year}</p><h2>{vehicle.make} {vehicle.model}</h2></div><span className="plate">{vehicle.plateNumber}</span></div><dl><div><dt><Gauge size={15} /> Mileage</dt><dd>{vehicle.mileage.toLocaleString()} km</dd></div><div><dt><KeyRound size={15} /> VIN</dt><dd>{vehicle.vin.slice(-8)}</dd></div><div><dt><History size={15} /> Added</dt><dd>{formatDate(vehicle.createdAt)}</dd></div></dl><div className="vehicle-card__footer"><History size={15} /><span>Service history synced</span><strong>{index + 1} record{index ? "s" : ""}</strong></div></div></article>)}</section> : <EmptyState icon={Car} title="No vehicles yet" detail="Add your first vehicle to start booking service appointments." action={<button className="button button--primary" type="button" onClick={() => setModalOpen(true)}><Plus size={17} />Add vehicle</button>} />}

      {modalOpen && <Modal title="Add a vehicle" detail="Enter the registration details exactly as shown on the vehicle record." onClose={() => { setModalOpen(false); setError(""); }}><form className="modal-form" onSubmit={submit}><div className="form-grid"><label>Make<input value={form.make} onChange={(event) => setForm({ ...form, make: event.target.value })} placeholder="Volvo" required minLength={2} /></label><label>Model<input value={form.model} onChange={(event) => setForm({ ...form, model: event.target.value })} placeholder="XC60" required /></label><label>Year<input type="number" min="1980" max="2027" value={form.year} onChange={(event) => setForm({ ...form, year: event.target.value })} required /></label><label>Plate number<input value={form.plateNumber} onChange={(event) => setForm({ ...form, plateNumber: event.target.value.toUpperCase() })} placeholder="CAR-2841" required /></label><label className="form-span-2">VIN <span>17 characters</span><input value={form.vin} onChange={(event) => setForm({ ...form, vin: event.target.value.toUpperCase() })} minLength={17} maxLength={17} placeholder="YV4A22RK4N1982841" required /></label><label>Mileage (km)<input type="number" min="0" value={form.mileage} onChange={(event) => setForm({ ...form, mileage: event.target.value })} required /></label><label>Color<input value={form.color} onChange={(event) => setForm({ ...form, color: event.target.value })} placeholder="Graphite" /></label></div>{error && <div className="form-error">{error}</div>}<div className="modal__actions"><button className="button button--secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</button><button className="button button--primary" type="submit" disabled={saving}>{saving ? <span className="spinner spinner--light" /> : "Add vehicle"}</button></div></form></Modal>}
      {toast && <Toast message={toast} tone="success" onClose={() => setToast("")} />}
    </div>
  );
}
