# EvoDoc

EvoDoc is a lightweight hospital management web app with two role-based portals:

- Receptionist / Nurse
- Doctor

It uses Supabase for data storage and runs as a static frontend without a build step.

## Files

- `index.html` - application shell and UI
- `styles.css` - layout, components, and responsive design
- `app.js` - Supabase integration and client logic
- `supabase-schema.sql` - paste this into the Supabase SQL Editor

## Run Locally

Open `index.html` in a browser, or serve the folder with any static server.

## Supabase Setup

1. Open your Supabase project SQL Editor.
2. Paste the contents of `supabase-schema.sql`.
3. Run the SQL.
4. Open the app and use the built-in Supabase URL and publishable key already configured in `app.js`.

## Main Features

- Patient intake with validation
- Appointment booking and management
- Doctor dashboard with daily and weekly counts
- Patient history and clinical note management
- Appointment filtering and cancellation
