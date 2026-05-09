# Telemedicine Appointment Platform Backend

Node.js + Express + MongoDB backend for a hospital telemedicine appointment platform.

## Features

- JWT authentication with role-based access control
- Versioned API routing at `/api/v1`
- Doctor search and profile management
- Appointment booking, update, and cancellation
- Prescription creation and retrieval
- Security middleware: Helmet, CORS, rate limiting
- API test-ready setup with Jest and SuperTest

## Getting Started

1. Copy `.env.example` to `.env`
2. Install dependencies: `npm install`
3. Start locally: `npm run dev`

## Scripts

- `npm start` - production start
- `npm run dev` - development with nodemon
- `npm test` - run Jest tests

## API Base

All endpoints are versioned under `/api/v1`.

## Notes

This scaffold is intentionally minimal so the frontend can be added next.
