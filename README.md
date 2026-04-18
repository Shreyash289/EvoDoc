🏥 EvoDoc

EvoDoc is a lightweight, role-based hospital management web app with portals for Receptionists/Nurses and Doctors, built using a static frontend and Supabase backend.

 Run Locally
Clone or download the project
Open your Supabase project

Go to SQL Editor and run:

supabase-schema.sql

Open the project folder and launch:

index.html

in your browser

(Optional) Run with a static server:

npx serve
 Configuration

Supabase URL and anon key are already configured in:

app.js
No build step or installation required
 Key Decisions & Trade-offs

1. No Build Tools (Pure HTML/CSS/JS)

 Faster setup, zero configuration
 Limited scalability for larger applications

2. Supabase as Backend (BaaS)

 Quick integration, handles database & APIs
 Less control compared to custom backend

3. Static Frontend Architecture

 Simple deployment and lightweight performance
 No advanced state management or routing

4. Focus on Core Features Only

 Clean UX and fast implementation
 Missing features like authentication and notifications
 Summary

EvoDoc prioritizes simplicity, speed, and usability, making it ideal for demos, small-scale deployments, and rapid prototyping of healthcare workflows.
