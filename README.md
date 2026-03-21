# Libyan Learn Hub

A comprehensive Learning Management System built for the Libyan market, featuring localized content (Arabic/English), local currency integration (LYD), live sessions, and multi-platform support (Web & Mobile).

## Project Structure

This is a monolithic repository managed by pnpm workspaces.

* `artifacts/api-server`: the Node.js / Express backend API serving web and mobile.
* `artifacts/lms-web`: the React / Vite frontend application for students and teachers.
* `artifacts/lms-mobile`: the React Native / Expo mobile application for students.
* `lib/db`: PostgreSQL schema definitions mapping using Drizzle ORM.
* `lib/api-zod`: Shared Zod validation schemas for requests and responses.
* `lib/api-client-react`: Shared React Query hooks for the frontend applications.

## Quick Start

1. Install dependencies:
   ```bash
   pnpm install
   ```
2. Build local packages:
   ```bash
   pnpm build
   ```
3. Start the development servers:
   ```bash
   pnpm dev
   ```

## Key Technologies
- **Frontend**: React, Tailwind CSS, TanStack Query, React Hook Form, Wouter.
- **Backend**: Express, Drizzle ORM, PostgreSQL, bcrypt, JWT.
- **Mobile**: Expo, React Native.

## Core Roles
- **Student**: Can browse and enroll in courses, view lessons, and join live sessions.
- **Teacher**: Can create and manage courses, view enrolled students, and track revenue.
- **Admin**: Has platform-wide access to manage users, approve payments, and oversee all courses.
