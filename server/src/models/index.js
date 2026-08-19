import mongoose from "mongoose";

const { Schema, model, models } = mongoose;
const options = { timestamps: true };
const statusValues = ["booked", "inspected", "awaiting_approval", "in_progress", "ready", "completed"];

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ["customer", "technician", "admin"], required: true, index: true },
}, options);

const vehicleSchema = new Schema({
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  make: { type: String, required: true },
  model: { type: String, required: true },
  year: { type: Number, required: true },
  plateNumber: { type: String, required: true, unique: true, uppercase: true },
  vin: { type: String, required: true, unique: true, uppercase: true },
  mileage: { type: Number, default: 0 },
  color: String,
}, options);

const bookingSchema = new Schema({
  vehicleId: { type: Schema.Types.ObjectId, ref: "Vehicle", required: true, index: true },
  customerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  scheduledAt: { type: Date, required: true, index: true },
  serviceType: { type: String, required: true },
  complaint: { type: String, required: true },
  status: { type: String, enum: statusValues, default: "booked", index: true },
}, options);

const taskSchema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ["part", "labor"], required: true },
  quantity: { type: Number, min: 0, required: true },
  unitPrice: { type: Number, min: 0, required: true },
  complete: { type: Boolean, default: false },
}, { _id: true });

const workOrderSchema = new Schema({
  bookingId: { type: Schema.Types.ObjectId, ref: "ServiceBooking", required: true, unique: true },
  technicianId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  findings: String,
  bay: String,
  tasks: [taskSchema],
  status: { type: String, enum: statusValues, default: "booked", index: true },
}, options);

const lineItemSchema = new Schema({
  description: { type: String, required: true },
  quantity: { type: Number, min: 0, required: true },
  unitPrice: { type: Number, min: 0, required: true },
}, { _id: false });

const estimateSchema = new Schema({
  workOrderId: { type: Schema.Types.ObjectId, ref: "WorkOrder", required: true, unique: true },
  lineItems: [lineItemSchema],
  total: { type: Number, min: 0, required: true },
  approvalStatus: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
}, options);

const invoiceSchema = new Schema({
  workOrderId: { type: Schema.Types.ObjectId, ref: "WorkOrder", required: true, unique: true },
  invoiceNumber: { type: String, required: true, unique: true },
  lineItems: [lineItemSchema],
  subtotal: { type: Number, min: 0, required: true },
  tax: { type: Number, min: 0, required: true },
  total: { type: Number, min: 0, required: true },
  paymentStatus: { type: String, enum: ["unpaid", "paid", "refunded"], default: "unpaid", index: true },
  issuedAt: { type: Date, default: Date.now },
}, options);

export const User = models.User || model("User", userSchema);
export const Vehicle = models.Vehicle || model("Vehicle", vehicleSchema);
export const ServiceBooking = models.ServiceBooking || model("ServiceBooking", bookingSchema);
export const WorkOrder = models.WorkOrder || model("WorkOrder", workOrderSchema);
export const Estimate = models.Estimate || model("Estimate", estimateSchema);
export const Invoice = models.Invoice || model("Invoice", invoiceSchema);
