# AutoServe Vehicle Service Management

AutoServe is a full-stack vehicle service operations workspace for customers, technicians, and service advisors. It connects vehicle registration, appointment booking, technician assignment, inspection findings, estimate approval, repair progress, invoices, and service history in one responsive application.

![AutoServe service center](client/public/images/service-studio.png)

## Demo

The project starts with a seeded in-memory store, so every workflow is immediately available without provisioning MongoDB.

| Role | Email | Password |
| --- | --- | --- |
| Customer | `customer@autoserve.demo` | `demo123` |
| Technician | `technician@autoserve.demo` | `demo123` |
| Administrator | `admin@autoserve.demo` | `demo123` |

Local application: `http://127.0.0.1:5173`

## Features

### Customer

- Register vehicles with VIN, registration, mileage, and ownership validation.
- Book service appointments and follow a six-stage service timeline.
- Review inspection findings and approve or decline repair estimates.
- Review completed service invoices and payment status.
- See vehicle service activity in a focused customer dashboard.

### Technician

- Review assigned work orders and workshop bays.
- Complete approved labor and parts tasks.
- Record inspection and repair notes.
- Move work through guarded service status transitions.
- Monitor task completion and daily workload.

### Administrator / Service Advisor

- View the live workshop schedule and active service load.
- Assign or reassign technicians and workshop bays.
- Track estimates from preparation through customer approval.
- Review invoices and reconcile payment status.
- Monitor approval delays and floor activity.

## Technology

- React 19, TypeScript, Vite, and Lucide icons
- Node.js and Express 5 REST API
- Zod request validation
- JWT authentication and bcrypt password hashing
- Helmet security headers and restricted CORS
- Mongoose domain models with relationships, enums, indexes, and timestamps
- Node's built-in test runner

## Architecture

```text
vehicle-service-management/
|-- client/
|   |-- public/images/
|   `-- src/
|       |-- components/
|       |-- pages/
|       |-- api.ts
|       |-- types.ts
|       `-- styles.css
|-- server/
|   |-- src/
|   |   |-- data/
|   |   |-- middleware/
|   |   |-- models/
|   |   |-- app.js
|   |   `-- server.js
|   `-- test/
|-- package.json
`-- README.md
```

The API currently uses a deterministic in-memory repository for the portfolio demo. Mongoose schemas are included for `User`, `Vehicle`, `ServiceBooking`, `WorkOrder`, `Estimate`, and `Invoice`, ready for a persistent repository implementation when `MONGODB_URI` is configured.

## Getting Started

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- MongoDB is optional for the seeded demo

### Install and run

```bash
npm install
npm run dev
```

This starts:

- Web application: `http://127.0.0.1:5173`
- REST API: `http://127.0.0.1:5050`

### Environment

Copy `server/.env.example` to `server/.env` when custom configuration is needed.

```dotenv
PORT=5050
MONGODB_URI=
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:5173
```

Never commit `.env` files or real secret values.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Run API and Vite development servers together |
| `npm run build` | Type-check and build the client, then syntax-check the API |
| `npm test` | Run API authentication and authorization tests |
| `npm start` | Start the Express API |

## API Summary

All private routes require `Authorization: Bearer <token>`.

| Method | Endpoint | Access |
| --- | --- | --- |
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/dashboard` | Authenticated |
| `GET / POST` | `/api/vehicles` | Authenticated / customer |
| `GET` | `/api/vehicles/:id/history` | Owner or administrator |
| `GET / POST` | `/api/bookings` | Authenticated / customer |
| `PUT` | `/api/admin/bookings/:id/assign` | Administrator |
| `GET` | `/api/work-orders` | Assigned technician, owner, or administrator |
| `PUT` | `/api/work-orders/:id/status` | Technician or administrator |
| `PATCH` | `/api/work-orders/:id/tasks/:taskId` | Technician or administrator |
| `POST` | `/api/work-orders/:id/estimate` | Administrator |
| `PUT` | `/api/estimates/:id/approve` | Owning customer |
| `POST` | `/api/work-orders/:id/invoice` | Administrator |
| `PUT` | `/api/invoices/:id/payment` | Administrator |

Successful responses use a consistent envelope:

```json
{
  "success": true,
  "message": "Operation completed",
  "data": {}
}
```

## Security and Business Rules

- JWT middleware protects private routes and attaches the authenticated user.
- Role middleware restricts technician and administrator operations.
- Customer-owned vehicles, bookings, estimates, and invoices are ownership checked.
- Passwords are stored as bcrypt hashes, including demo credentials.
- Zod rejects malformed or incomplete request bodies.
- Technicians cannot move a work order backward or update another technician's work.
- Helmet adds secure HTTP response headers and CORS is restricted to the configured client.
- Centralized 404 and error responses do not expose stack traces.

## Verification

```text
npm run build
  React TypeScript build: passed
  Vite production bundle: passed
  Server syntax checks: passed

npm test
  Tests: 3 passed, 0 failed
```

The live local verification also covers the Vite-to-Express proxy, health endpoint, customer login, and authenticated vehicle ownership response.

## Known Limitations

- Demo mutations reset when the API process restarts.
- Mongoose schemas are present, but route persistence still uses the in-memory repository.
- Payment processing, SMS notifications, image evidence, fleet accounts, and parts inventory are future integrations.
- Production deployment configuration is not included in this local-first build.

## Roadmap

- Add a Mongoose repository and migration-safe seed command.
- Add refresh tokens, password reset, rate limiting, and audit events.
- Generate downloadable PDF invoices and estimates on the server.
- Add parts inventory, maintenance reminders, and customer notifications.
- Expand integration and browser automation coverage for every role workflow.
