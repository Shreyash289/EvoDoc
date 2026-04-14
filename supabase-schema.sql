create extension if not exists pgcrypto;

drop table if exists clinical_notes cascade;
drop table if exists appointments cascade;
drop table if exists patients cascade;
drop table if exists doctors cascade;

create table doctors (
  doctor_id uuid primary key default gen_random_uuid(),
  name text not null,
  specialization text not null,
  availability_status text not null default 'Available'
    check (availability_status in ('Available', 'Busy', 'On Leave')),
  created_at timestamptz not null default now()
);

create table patients (
  patient_id uuid primary key default gen_random_uuid(),
  full_name text not null,
  dob date not null,
  gender text not null check (gender in ('Male', 'Female', 'Other')),
  contact_number text not null check (contact_number ~ '^[0-9]{10}$'),
  emergency_contact text check (emergency_contact is null or emergency_contact = '' or emergency_contact ~ '^[0-9]{10}$'),
  blood_group text,
  allergies text,
  chronic_conditions text,
  current_medications text,
  created_at timestamptz not null default now()
);

create table appointments (
  appointment_id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(patient_id) on delete cascade,
  doctor_id uuid not null references doctors(doctor_id) on delete restrict,
  appointment_date date not null,
  appointment_time text not null check (appointment_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
  type text not null check (type in ('Consultation', 'Follow-up', 'Emergency')),
  notes text,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table clinical_notes (
  note_id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references patients(patient_id) on delete cascade,
  doctor_id uuid not null references doctors(doctor_id) on delete restrict,
  note_date date not null default current_date,
  notes text not null,
  created_at timestamptz not null default now()
);

create unique index appointments_doctor_slot_unique
  on appointments (doctor_id, appointment_date, appointment_time)
  where status <> 'cancelled';

create index appointments_patient_idx on appointments (patient_id);
create index appointments_doctor_idx on appointments (doctor_id);
create index notes_patient_idx on clinical_notes (patient_id);

alter table doctors enable row level security;
alter table patients enable row level security;
alter table appointments enable row level security;
alter table clinical_notes enable row level security;

drop policy if exists "Public doctors access" on doctors;
drop policy if exists "Public patients access" on patients;
drop policy if exists "Public appointments access" on appointments;
drop policy if exists "Public notes access" on clinical_notes;
drop policy if exists "Authenticated doctors access" on doctors;
drop policy if exists "Authenticated patients access" on patients;
drop policy if exists "Authenticated appointments access" on appointments;
drop policy if exists "Authenticated notes access" on clinical_notes;

create policy "Authenticated doctors access"
on doctors
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated patients access"
on patients
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated appointments access"
on appointments
for all
to authenticated
using (true)
with check (true);

create policy "Authenticated notes access"
on clinical_notes
for all
to authenticated
using (true)
with check (true);

insert into doctors (name, specialization, availability_status) values
  ('Dr. Meera Shah', 'General Physician', 'Available'),
  ('Dr. Arjun Nair', 'Cardiologist', 'Busy'),
  ('Dr. Kavya Rao', 'Dermatologist', 'Available'),
  ('Dr. Rohan Malhotra', 'Orthopedic Surgeon', 'On Leave');
