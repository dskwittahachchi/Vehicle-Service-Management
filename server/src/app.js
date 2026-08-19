import bcrypt from "bcryptjs";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { z } from "zod";
import { allowRoles, authenticate, issueToken } from "./middleware/auth.js";
import { demoStore, STATUSES } from "./data/demoStore.js";

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "250kb" }));

const ok = (res, data, message = "Operation completed") => res.json({ success: true, message, data });
const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({
      success: false,
      message: "Please review the highlighted information",
      errors: result.error.issues.map((issue) => ({ path: issue.path.join("."), message: issue.message })),
    });
  }
  req.validatedBody = result.data;
  return next();
};

const publicUser = ({ passwordHash, ...user }) => user;
const vehicleFor = (booking) => demoStore.vehicles.find((vehicle) => vehicle.id === booking.vehicleId);
const bookingFor = (workOrder) => demoStore.bookings.find((booking) => booking.id === workOrder.bookingId);
const estimateFor = (workOrder) => demoStore.estimates.find((estimate) => estimate.workOrderId === workOrder.id);
const invoiceFor = (workOrder) => demoStore.invoices.find((invoice) => invoice.workOrderId === workOrder.id);
const lineItemSchema = z.object({ description: z.string().min(2), quantity: z.number().positive(), unitPrice: z.number().nonnegative() });

function decorateBooking(booking) {
  const workOrder = demoStore.workOrders.find((work) => work.bookingId === booking.id);
  const technician = workOrder && demoStore.users.find((user) => user.id === workOrder.technicianId);
  return {
    ...booking,
    vehicle: vehicleFor(booking),
    workOrder: workOrder ? { ...workOrder, technician: technician ? publicUser(technician) : null, estimate: estimateFor(workOrder), invoice: invoiceFor(workOrder) } : null,
  };
}

function canAccessBooking(user, booking) {
  if (!booking) return false;
  if (user.role === "admin") return true;
  if (user.role === "customer") return booking.customerId === user.id;
  const workOrder = demoStore.workOrders.find((work) => work.bookingId === booking.id);
  return workOrder?.technicianId === user.id;
}

function decoratedOrder(order) {
  return { ...order, booking: decorateBooking(bookingFor(order)), estimate: estimateFor(order), invoice: invoiceFor(order) };
}

app.get("/api/health", (_req, res) => ok(res, { status: "healthy", mode: process.env.MONGODB_URI ? "mongodb-ready" : "demo-memory" }));

app.post("/api/auth/login", validate(z.object({ email: z.email(), password: z.string().min(6) })), async (req, res) => {
  const user = demoStore.users.find((candidate) => candidate.email === req.validatedBody.email.toLowerCase());
  const valid = user && (await bcrypt.compare(req.validatedBody.password, user.passwordHash));
  if (!valid) return res.status(401).json({ success: false, message: "Email or password is incorrect", errors: [] });
  return ok(res, { token: issueToken(user), user: publicUser(user) }, `Welcome back, ${user.name.split(" ")[0]}`);
});

app.get("/api/auth/me", authenticate, (req, res) => ok(res, publicUser(req.user)));

app.get("/api/dashboard", authenticate, (req, res) => {
  const bookings = demoStore.bookings.filter((booking) => canAccessBooking(req.user, booking));
  const orders = demoStore.workOrders.filter((order) => canAccessBooking(req.user, bookingFor(order)));
  const pending = orders.map(estimateFor).filter((estimate) => estimate?.approvalStatus === "pending");
  const unpaid = orders.map(invoiceFor).filter((invoice) => invoice?.paymentStatus === "unpaid");
  const tasks = orders.flatMap((order) => order.tasks);
  return ok(res, {
    metrics: {
      activeJobs: bookings.filter((booking) => booking.status !== "completed").length,
      vehicles: req.user.role === "customer" ? demoStore.vehicles.filter((vehicle) => vehicle.customerId === req.user.id).length : demoStore.vehicles.length,
      pendingApprovals: pending.length,
      unpaidInvoices: unpaid.length,
      taskCompletion: tasks.length ? Math.round((tasks.filter((task) => task.complete).length / tasks.length) * 100) : 0,
    },
    bookings: bookings.map(decorateBooking),
    activity: demoStore.activity,
  });
});

app.get("/api/vehicles", authenticate, (req, res) => {
  const vehicles = req.user.role === "customer" ? demoStore.vehicles.filter((vehicle) => vehicle.customerId === req.user.id) : demoStore.vehicles;
  return ok(res, vehicles);
});

app.post(
  "/api/vehicles",
  authenticate,
  allowRoles("customer", "admin"),
  validate(z.object({ make: z.string().min(2), model: z.string().min(1), year: z.number().int().min(1980).max(2027), plateNumber: z.string().min(3), vin: z.string().length(17), mileage: z.number().min(0), color: z.string().optional() })),
  (req, res) => {
    if (demoStore.vehicles.some((vehicle) => vehicle.vin === req.validatedBody.vin.toUpperCase())) {
      return res.status(409).json({ success: false, message: "A vehicle with this VIN already exists", errors: [] });
    }
    const vehicle = { id: `veh_${Date.now()}`, customerId: req.user.id, ...req.validatedBody, plateNumber: req.validatedBody.plateNumber.toUpperCase(), vin: req.validatedBody.vin.toUpperCase(), createdAt: new Date().toISOString() };
    demoStore.vehicles.push(vehicle);
    return res.status(201).json({ success: true, message: "Vehicle added", data: vehicle });
  },
);

app.get("/api/vehicles/:id/history", authenticate, (req, res) => {
  const vehicle = demoStore.vehicles.find((candidate) => candidate.id === req.params.id);
  if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found", errors: [] });
  if (req.user.role === "customer" && vehicle.customerId !== req.user.id) return res.status(403).json({ success: false, message: "You cannot view this vehicle", errors: [] });
  return ok(res, { vehicle, history: demoStore.bookings.filter((booking) => booking.vehicleId === vehicle.id).map(decorateBooking) });
});

app.get("/api/bookings", authenticate, (req, res) => ok(res, demoStore.bookings.filter((booking) => canAccessBooking(req.user, booking)).map(decorateBooking)));

app.post(
  "/api/bookings",
  authenticate,
  allowRoles("customer"),
  validate(z.object({ vehicleId: z.string().min(1), scheduledAt: z.iso.datetime(), serviceType: z.string().min(2), complaint: z.string().min(10) })),
  (req, res) => {
    const vehicle = demoStore.vehicles.find((candidate) => candidate.id === req.validatedBody.vehicleId && candidate.customerId === req.user.id);
    if (!vehicle) return res.status(404).json({ success: false, message: "Vehicle not found", errors: [] });
    const booking = { id: `book_${Date.now()}`, customerId: req.user.id, status: "booked", createdAt: new Date().toISOString(), ...req.validatedBody };
    demoStore.bookings.push(booking);
    return res.status(201).json({ success: true, message: "Service appointment booked", data: decorateBooking(booking) });
  },
);

app.get("/api/technicians", authenticate, allowRoles("admin"), (_req, res) => ok(res, demoStore.users.filter((user) => user.role === "technician").map(publicUser)));

app.put(
  "/api/admin/bookings/:id/assign",
  authenticate,
  allowRoles("admin"),
  validate(z.object({ technicianId: z.string().min(1), bay: z.string().min(2) })),
  (req, res) => {
    const booking = demoStore.bookings.find((candidate) => candidate.id === req.params.id);
    const technician = demoStore.users.find((user) => user.id === req.validatedBody.technicianId && user.role === "technician");
    if (!booking || !technician) return res.status(404).json({ success: false, message: "Booking or technician not found", errors: [] });
    let order = demoStore.workOrders.find((candidate) => candidate.bookingId === booking.id);
    if (order) Object.assign(order, { technicianId: technician.id, bay: req.validatedBody.bay });
    else {
      order = { id: `wo_${Date.now()}`, bookingId: booking.id, technicianId: technician.id, bay: req.validatedBody.bay, findings: "", tasks: [], status: "booked", updatedAt: new Date().toISOString() };
      demoStore.workOrders.push(order);
    }
    return ok(res, decorateBooking(booking), `Assigned to ${technician.name}`);
  },
);

app.get("/api/work-orders", authenticate, (req, res) => {
  return ok(res, demoStore.workOrders.filter((order) => canAccessBooking(req.user, bookingFor(order))).map(decoratedOrder));
});

app.put(
  "/api/work-orders/:id/status",
  authenticate,
  allowRoles("technician", "admin"),
  validate(z.object({ status: z.enum(STATUSES), findings: z.string().optional() })),
  (req, res) => {
    const order = demoStore.workOrders.find((candidate) => candidate.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Work order not found", errors: [] });
    if (req.user.role === "technician" && order.technicianId !== req.user.id) return res.status(403).json({ success: false, message: "This work order is assigned to another technician", errors: [] });
    const statusOrder = Object.fromEntries(STATUSES.map((status, index) => [status, index]));
    if (statusOrder[req.validatedBody.status] < statusOrder[order.status] && req.user.role !== "admin") {
      return res.status(400).json({ success: false, message: "Technicians cannot move a work order backward", errors: [] });
    }
    order.status = req.validatedBody.status;
    order.findings = req.validatedBody.findings ?? order.findings;
    order.updatedAt = new Date().toISOString();
    bookingFor(order).status = order.status;
    return ok(res, decoratedOrder(order), `Work order moved to ${order.status.replaceAll("_", " ")}`);
  },
);

app.patch(
  "/api/work-orders/:id/tasks/:taskId",
  authenticate,
  allowRoles("technician", "admin"),
  validate(z.object({ complete: z.boolean() })),
  (req, res) => {
    const order = demoStore.workOrders.find((candidate) => candidate.id === req.params.id);
    const task = order?.tasks.find((candidate) => candidate.id === req.params.taskId);
    if (!order || !task) return res.status(404).json({ success: false, message: "Work order task not found", errors: [] });
    if (req.user.role === "technician" && order.technicianId !== req.user.id) return res.status(403).json({ success: false, message: "This work order is assigned to another technician", errors: [] });
    task.complete = req.validatedBody.complete;
    order.updatedAt = new Date().toISOString();
    return ok(res, decoratedOrder(order), task.complete ? "Task marked complete" : "Task reopened");
  },
);

app.get("/api/estimates", authenticate, (req, res) => {
  const estimates = demoStore.estimates.filter((estimate) => {
    const order = demoStore.workOrders.find((candidate) => candidate.id === estimate.workOrderId);
    return order && canAccessBooking(req.user, bookingFor(order));
  }).map((estimate) => ({ ...estimate, workOrder: decoratedOrder(demoStore.workOrders.find((order) => order.id === estimate.workOrderId)) }));
  return ok(res, estimates);
});

app.post(
  "/api/work-orders/:id/estimate",
  authenticate,
  allowRoles("admin"),
  validate(z.object({ lineItems: z.array(lineItemSchema).min(1) })),
  (req, res) => {
    const order = demoStore.workOrders.find((candidate) => candidate.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Work order not found", errors: [] });
    const total = req.validatedBody.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    let estimate = estimateFor(order);
    if (estimate) Object.assign(estimate, { lineItems: req.validatedBody.lineItems, total, approvalStatus: "pending" });
    else {
      estimate = { id: `est_${Date.now()}`, workOrderId: order.id, lineItems: req.validatedBody.lineItems, total, approvalStatus: "pending", createdAt: new Date().toISOString() };
      demoStore.estimates.push(estimate);
    }
    order.status = "awaiting_approval";
    bookingFor(order).status = "awaiting_approval";
    return res.status(201).json({ success: true, message: "Estimate sent for customer approval", data: estimate });
  },
);

app.put(
  "/api/estimates/:id/approve",
  authenticate,
  allowRoles("customer"),
  validate(z.object({ decision: z.enum(["approved", "rejected"]) })),
  (req, res) => {
    const estimate = demoStore.estimates.find((candidate) => candidate.id === req.params.id);
    const order = estimate && demoStore.workOrders.find((candidate) => candidate.id === estimate.workOrderId);
    const booking = order && bookingFor(order);
    if (!estimate || !order || !booking) return res.status(404).json({ success: false, message: "Estimate not found", errors: [] });
    if (booking.customerId !== req.user.id) return res.status(403).json({ success: false, message: "You cannot approve this estimate", errors: [] });
    estimate.approvalStatus = req.validatedBody.decision;
    if (req.validatedBody.decision === "approved") {
      order.status = "in_progress";
      booking.status = "in_progress";
    }
    return ok(res, estimate, req.validatedBody.decision === "approved" ? "Estimate approved - work can begin" : "Estimate declined");
  },
);

app.get("/api/invoices", authenticate, (req, res) => {
  const invoices = demoStore.invoices.filter((invoice) => {
    const order = demoStore.workOrders.find((candidate) => candidate.id === invoice.workOrderId);
    return order && canAccessBooking(req.user, bookingFor(order));
  }).map((invoice) => ({ ...invoice, workOrder: decoratedOrder(demoStore.workOrders.find((order) => order.id === invoice.workOrderId)) }));
  return ok(res, invoices);
});

app.post(
  "/api/work-orders/:id/invoice",
  authenticate,
  allowRoles("admin"),
  validate(z.object({ lineItems: z.array(lineItemSchema).min(1), taxRate: z.number().min(0).max(1).default(0.08) })),
  (req, res) => {
    const order = demoStore.workOrders.find((candidate) => candidate.id === req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Work order not found", errors: [] });
    if (invoiceFor(order)) return res.status(409).json({ success: false, message: "An invoice already exists for this work order", errors: [] });
    const subtotal = req.validatedBody.lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const tax = Number((subtotal * req.validatedBody.taxRate).toFixed(2));
    const invoice = { id: `inv_${Date.now()}`, workOrderId: order.id, invoiceNumber: `INV-2026-${String(demoStore.invoices.length + 3025).padStart(4, "0")}`, lineItems: req.validatedBody.lineItems, subtotal, tax, total: subtotal + tax, paymentStatus: "unpaid", issuedAt: new Date().toISOString() };
    demoStore.invoices.push(invoice);
    return res.status(201).json({ success: true, message: "Invoice generated", data: invoice });
  },
);

app.put(
  "/api/invoices/:id/payment",
  authenticate,
  allowRoles("admin"),
  validate(z.object({ paymentStatus: z.enum(["unpaid", "paid", "refunded"]) })),
  (req, res) => {
    const invoice = demoStore.invoices.find((candidate) => candidate.id === req.params.id);
    if (!invoice) return res.status(404).json({ success: false, message: "Invoice not found", errors: [] });
    invoice.paymentStatus = req.validatedBody.paymentStatus;
    return ok(res, invoice, "Payment status updated");
  },
);

app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found", errors: [] }));
app.use((error, _req, res, _next) => {
  console.error(error);
  return res.status(500).json({ success: false, message: "An unexpected server error occurred", errors: [] });
});

export default app;
