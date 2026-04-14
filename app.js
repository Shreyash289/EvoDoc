import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const SUPABASE_URL = "https://jqrwqrvxslbuqjlhzcoq.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_TKHTXsG0fxCU98GMZ2xJJA_BQrkG_-u";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const state = {
  patients: [],
  doctors: [],
  appointments: [],
  selectedDoctorId: "",
  selectedPatientForDoctor: null,
  selectedDoctorAppointment: null,
};

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
];

const dom = {
  connectionStatus: document.getElementById("connection-status"),
  heroPatientCount: document.getElementById("hero-patient-count"),
  heroAppointmentCount: document.getElementById("hero-appointment-count"),
  roleButtons: [...document.querySelectorAll(".role-btn")],
  portals: [...document.querySelectorAll(".portal")],
  patientForm: document.getElementById("patient-form"),
  patientReset: document.getElementById("patient-reset"),
  appointmentForm: document.getElementById("appointment-form"),
  appointmentReset: document.getElementById("appointment-reset"),
  refreshAppointments: document.getElementById("refresh-appointments"),
  patientSearch: document.getElementById("patient-search"),
  patientSearchResults: document.getElementById("patient-search-results"),
  doctorSelect: document.getElementById("doctor-select"),
  doctorAvailability: document.getElementById("doctor-availability"),
  filterDoctor: document.getElementById("filter-doctor"),
  filterDate: document.getElementById("filter-date"),
  filterStatus: document.getElementById("filter-status"),
  appointmentsTableBody: document.getElementById("appointments-table-body"),
  appointmentTime: document.getElementById("appointment-time"),
  doctorDashboardSelect: document.getElementById("doctor-dashboard-select"),
  doctorTodayCount: document.getElementById("doctor-today-count"),
  doctorWeekCount: document.getElementById("doctor-week-count"),
  doctorRecentPatients: document.getElementById("doctor-recent-patients"),
  doctorNotification: document.getElementById("doctor-notification"),
  doctorProfileLine: document.getElementById("doctor-profile-line"),
  doctorAppointments: document.getElementById("doctor-appointments"),
  doctorFilterDate: document.getElementById("doctor-filter-date"),
  doctorFilterStatus: document.getElementById("doctor-filter-status"),
  doctorFilterSearch: document.getElementById("doctor-filter-search"),
  patientDetailTitle: document.getElementById("patient-detail-title"),
  patientDetailEmpty: document.getElementById("patient-detail-empty"),
  patientDetailContent: document.getElementById("patient-detail-content"),
  patientBasic: document.getElementById("patient-basic"),
  patientMedical: document.getElementById("patient-medical"),
  patientHistory: document.getElementById("patient-history"),
  patientNotesList: document.getElementById("patient-notes-list"),
  noteForm: document.getElementById("note-form"),
  notePatientId: document.getElementById("note-patient-id"),
  toast: document.getElementById("toast"),
  tabs: [...document.querySelectorAll(".tab-btn")],
  tabContents: [...document.querySelectorAll(".tab-content")],
};

document.addEventListener("DOMContentLoaded", init);

async function init() {
  renderTimeSlots();
  bindEvents();
  await pingSupabase();
  await loadInitialData();
}

function bindEvents() {
  dom.roleButtons.forEach((button) => {
    button.addEventListener("click", () => switchRole(button.dataset.roleTarget));
  });

  dom.tabs.forEach((button) => {
    button.addEventListener("click", () => activateTab(button.dataset.tabTarget));
  });

  dom.patientForm.addEventListener("submit", handlePatientSubmit);
  dom.patientReset.addEventListener("click", resetPatientForm);
  dom.appointmentForm.addEventListener("submit", handleAppointmentSubmit);
  dom.appointmentReset.addEventListener("click", resetAppointmentForm);
  dom.refreshAppointments.addEventListener("click", loadInitialData);
  dom.patientSearch.addEventListener("input", handlePatientSearch);
  dom.doctorSelect.addEventListener("change", syncDoctorAvailability);
  dom.filterDoctor.addEventListener("change", renderAppointmentsTable);
  dom.filterDate.addEventListener("change", renderAppointmentsTable);
  dom.filterStatus.addEventListener("change", renderAppointmentsTable);
  dom.doctorDashboardSelect.addEventListener("change", handleDoctorSelection);
  dom.doctorFilterDate.addEventListener("input", renderDoctorAppointments);
  dom.doctorFilterStatus.addEventListener("input", renderDoctorAppointments);
  dom.doctorFilterSearch.addEventListener("input", renderDoctorAppointments);
  dom.noteForm.addEventListener("submit", handleNoteSubmit);
}

async function pingSupabase() {
  const { error } = await supabase.from("doctors").select("doctor_id").limit(1);

  if (error) {
    dom.connectionStatus.textContent = "Supabase connection failed. Run the SQL setup first.";
    dom.connectionStatus.className = "connection error";
    showToast("Supabase connection failed. Paste the SQL into Supabase first.");
    return;
  }

  dom.connectionStatus.textContent = "Supabase connected successfully.";
  dom.connectionStatus.className = "connection ok";
}

async function loadInitialData() {
  await Promise.all([loadPatients(), loadDoctors(), loadAppointments()]);
  updateHeroStats();
  populateDoctorSelects();
  renderAppointmentsTable();
  renderDoctorDashboard();
}

async function loadPatients() {
  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    showToast(error.message);
    return;
  }

  state.patients = data ?? [];
}

async function loadDoctors() {
  const { data, error } = await supabase
    .from("doctors")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    showToast(error.message);
    return;
  }

  state.doctors = data ?? [];
}

async function loadAppointments() {
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `
      *,
      patients (
        patient_id,
        full_name,
        contact_number,
        gender,
        dob,
        emergency_contact,
        blood_group,
        allergies,
        chronic_conditions,
        current_medications
      ),
      doctors (
        doctor_id,
        name,
        specialization,
        availability_status
      )
    `
    )
    .order("appointment_date", { ascending: true })
    .order("appointment_time", { ascending: true });

  if (error) {
    showToast(error.message);
    return;
  }

  state.appointments = data ?? [];
}

function updateHeroStats() {
  dom.heroPatientCount.textContent = String(state.patients.length);
  dom.heroAppointmentCount.textContent = String(state.appointments.length);
}

function populateDoctorSelects() {
  const baseDoctorOption = `<option value="">Select doctor</option>`;
  const options = state.doctors
    .map(
      (doctor) =>
        `<option value="${doctor.doctor_id}">${doctor.name} | ${doctor.specialization}</option>`
    )
    .join("");

  dom.doctorSelect.innerHTML = baseDoctorOption + options;
  dom.filterDoctor.innerHTML = `<option value="">All doctors</option>${options}`;
  dom.doctorDashboardSelect.innerHTML = baseDoctorOption + options;

  if (!state.selectedDoctorId && state.doctors.length > 0) {
    state.selectedDoctorId = String(state.doctors[0].doctor_id);
    dom.doctorDashboardSelect.value = state.selectedDoctorId;
  }

  syncDoctorAvailability();
}

function renderTimeSlots() {
  dom.appointmentTime.innerHTML = `<option value="">Select time</option>${timeSlots
    .map((slot) => `<option value="${slot}">${toDisplayTime(slot)}</option>`)
    .join("")}`;
}

function switchRole(targetId) {
  dom.roleButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.roleTarget === targetId);
  });

  dom.portals.forEach((portal) => {
    portal.classList.toggle("active", portal.id === targetId);
  });
}

function activateTab(targetId) {
  dom.tabs.forEach((button) => button.classList.toggle("active", button.dataset.tabTarget === targetId));
  dom.tabContents.forEach((content) => content.classList.toggle("active", content.id === targetId));
}

async function handlePatientSubmit(event) {
  event.preventDefault();

  const payload = readPatientForm();
  const validationError = validatePatient(payload);
  if (validationError) {
    showToast(validationError);
    return;
  }

  const patientId = document.getElementById("patient-id").value;
  const query = patientId
    ? supabase.from("patients").update(payload).eq("patient_id", patientId)
    : supabase.from("patients").insert(payload);

  const { error } = await query;

  if (error) {
    showToast(error.message);
    return;
  }

  showToast(patientId ? "Patient updated successfully." : "Patient saved successfully.");
  resetPatientForm();
  await loadInitialData();
}

function readPatientForm() {
  return {
    full_name: document.getElementById("full-name").value.trim(),
    dob: document.getElementById("dob").value,
    gender: document.getElementById("gender").value,
    contact_number: document.getElementById("contact-number").value.trim(),
    emergency_contact: document.getElementById("emergency-contact").value.trim(),
    blood_group: document.getElementById("blood-group").value,
    allergies: document.getElementById("allergies").value.trim(),
    chronic_conditions: document.getElementById("chronic-conditions").value.trim(),
    current_medications: document.getElementById("current-medications").value.trim(),
  };
}

function validatePatient(payload) {
  if (!payload.full_name) {
    return "Patient name is required.";
  }

  if (!payload.dob) {
    return "Valid date of birth is required.";
  }

  if (!/^\d{10}$/.test(payload.contact_number)) {
    return "Contact number must be a 10-digit value.";
  }

  if (payload.emergency_contact && !/^\d{10}$/.test(payload.emergency_contact)) {
    return "Emergency contact must be a 10-digit value.";
  }

  return "";
}

function resetPatientForm() {
  dom.patientForm.reset();
  document.getElementById("patient-id").value = "";
}

async function handlePatientSearch() {
  const term = dom.patientSearch.value.trim();

  if (term.length < 2) {
    dom.patientSearchResults.innerHTML = "";
    return;
  }

  const { data, error } = await supabase
    .from("patients")
    .select("*")
    .or(`full_name.ilike.%${term}%,contact_number.ilike.%${term}%`)
    .limit(8);

  if (error) {
    showToast(error.message);
    return;
  }

  if (!data?.length) {
    dom.patientSearchResults.innerHTML = `<div class="empty-state">No patient found. Create a new patient first.</div>`;
    return;
  }

  dom.patientSearchResults.innerHTML = data
    .map(
      (patient) => `
        <div class="search-item">
          <div>
            <strong>${escapeHtml(patient.full_name)}</strong>
            <p>${escapeHtml(patient.contact_number)} | ${escapeHtml(patient.gender ?? "Not set")}</p>
          </div>
          <button class="action-btn" data-patient-pick="${patient.patient_id}">Select</button>
        </div>
      `
    )
    .join("");

  [...dom.patientSearchResults.querySelectorAll("[data-patient-pick]")].forEach((button) => {
    button.addEventListener("click", () => selectAppointmentPatient(button.dataset.patientPick));
  });
}

function selectAppointmentPatient(patientId) {
  const patient = state.patients.find((entry) => String(entry.patient_id) === String(patientId));
  if (!patient) {
    showToast("Selected patient is not loaded yet. Refresh and try again.");
    return;
  }

  document.getElementById("appointment-patient-id").value = patient.patient_id;
  document.getElementById("selected-patient").value = `${patient.full_name} | ${patient.contact_number}`;
  dom.patientSearchResults.innerHTML = "";
  dom.patientSearch.value = patient.full_name;
}

function syncDoctorAvailability() {
  const doctorId = dom.doctorSelect.value;
  const doctor = state.doctors.find((entry) => String(entry.doctor_id) === String(doctorId));
  dom.doctorAvailability.value = doctor ? doctor.availability_status : "";
}

async function handleAppointmentSubmit(event) {
  event.preventDefault();

  const payload = readAppointmentForm();
  if (!payload.patient_id) {
    showToast("Select a patient before booking the appointment.");
    return;
  }

  if (!payload.doctor_id || !payload.appointment_date || !payload.appointment_time || !payload.type) {
    showToast("Doctor, date, time, and type are required.");
    return;
  }

  const appointmentId = document.getElementById("appointment-id").value;
  const conflict = state.appointments.find((appointment) => {
    return (
      String(appointment.doctor_id) === String(payload.doctor_id) &&
      appointment.appointment_date === payload.appointment_date &&
      appointment.appointment_time === payload.appointment_time &&
      appointment.status !== "cancelled" &&
      String(appointment.appointment_id) !== String(appointmentId)
    );
  });

  if (conflict) {
    showToast("Selected slot is already booked for this doctor.");
    return;
  }

  const query = appointmentId
    ? supabase.from("appointments").update(payload).eq("appointment_id", appointmentId)
    : supabase.from("appointments").insert(payload);

  const { error } = await query;

  if (error) {
    showToast(error.message);
    return;
  }

  const doctor = state.doctors.find((entry) => String(entry.doctor_id) === String(payload.doctor_id));
  showToast(
    appointmentId
      ? "Appointment updated successfully."
      : `Appointment confirmed with ${doctor?.name ?? "doctor"} on ${formatDate(payload.appointment_date)} at ${toDisplayTime(payload.appointment_time)}.`
  );
  resetAppointmentForm();
  await loadInitialData();
}

function readAppointmentForm() {
  return {
    patient_id: document.getElementById("appointment-patient-id").value,
    doctor_id: dom.doctorSelect.value,
    appointment_date: document.getElementById("appointment-date").value,
    appointment_time: document.getElementById("appointment-time").value,
    type: document.getElementById("appointment-type").value,
    notes: document.getElementById("appointment-notes").value.trim(),
    status: document.getElementById("appointment-status").value,
  };
}

function resetAppointmentForm() {
  dom.appointmentForm.reset();
  document.getElementById("appointment-id").value = "";
  document.getElementById("appointment-patient-id").value = "";
  document.getElementById("selected-patient").value = "";
  dom.patientSearchResults.innerHTML = "";
  syncDoctorAvailability();
}

function renderAppointmentsTable() {
  const doctorId = dom.filterDoctor.value;
  const date = dom.filterDate.value;
  const status = dom.filterStatus.value;

  const filtered = state.appointments.filter((appointment) => {
    return (
      (!doctorId || String(appointment.doctor_id) === String(doctorId)) &&
      (!date || appointment.appointment_date === date) &&
      (!status || appointment.status === status)
    );
  });

  if (!filtered.length) {
    dom.appointmentsTableBody.innerHTML = `
      <tr>
        <td colspan="7">
          <div class="empty-state">No appointments match the current filters.</div>
        </td>
      </tr>
    `;
    return;
  }

  dom.appointmentsTableBody.innerHTML = filtered
    .map(
      (appointment) => `
        <tr>
          <td>${escapeHtml(appointment.patients?.full_name ?? "Unknown patient")}</td>
          <td>${escapeHtml(appointment.doctors?.name ?? "Unknown doctor")}</td>
          <td>${formatDate(appointment.appointment_date)}</td>
          <td>${toDisplayTime(appointment.appointment_time)}</td>
          <td>${escapeHtml(appointment.type)}</td>
          <td><span class="pill ${appointment.status}">${capitalize(appointment.status)}</span></td>
          <td>
            <div class="table-actions">
              <button class="action-btn" data-view-appointment="${appointment.appointment_id}">View</button>
              <button class="action-btn" data-edit-appointment="${appointment.appointment_id}">Edit</button>
              <button class="action-btn danger" data-cancel-appointment="${appointment.appointment_id}">Cancel</button>
            </div>
          </td>
        </tr>
      `
    )
    .join("");

  [...dom.appointmentsTableBody.querySelectorAll("[data-view-appointment]")].forEach((button) => {
    button.addEventListener("click", () => openAppointmentInDoctorPanel(button.dataset.viewAppointment));
  });

  [...dom.appointmentsTableBody.querySelectorAll("[data-edit-appointment]")].forEach((button) => {
    button.addEventListener("click", () => populateAppointmentForm(button.dataset.editAppointment));
  });

  [...dom.appointmentsTableBody.querySelectorAll("[data-cancel-appointment]")].forEach((button) => {
    button.addEventListener("click", () => cancelAppointment(button.dataset.cancelAppointment));
  });
}

function populateAppointmentForm(appointmentId) {
  const appointment = state.appointments.find((entry) => String(entry.appointment_id) === String(appointmentId));
  if (!appointment) {
    return;
  }

  document.getElementById("appointment-id").value = appointment.appointment_id;
  document.getElementById("appointment-patient-id").value = appointment.patient_id;
  document.getElementById("selected-patient").value = `${appointment.patients?.full_name ?? ""} | ${appointment.patients?.contact_number ?? ""}`;
  dom.doctorSelect.value = appointment.doctor_id;
  document.getElementById("appointment-date").value = appointment.appointment_date;
  document.getElementById("appointment-time").value = appointment.appointment_time;
  document.getElementById("appointment-type").value = appointment.type;
  document.getElementById("appointment-notes").value = appointment.notes ?? "";
  document.getElementById("appointment-status").value = appointment.status;
  syncDoctorAvailability();
  showToast("Appointment loaded into the booking form for editing.");
}

async function cancelAppointment(appointmentId) {
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("appointment_id", appointmentId);

  if (error) {
    showToast(error.message);
    return;
  }

  showToast("Appointment cancelled.");
  await loadInitialData();
}

function handleDoctorSelection() {
  state.selectedDoctorId = dom.doctorDashboardSelect.value;
  state.selectedPatientForDoctor = null;
  state.selectedDoctorAppointment = null;
  renderDoctorDashboard();
  renderDoctorAppointments();
  resetDoctorPatientPanel();
}

function renderDoctorDashboard() {
  const doctor = state.doctors.find((entry) => String(entry.doctor_id) === String(state.selectedDoctorId));

  if (!doctor) {
    dom.doctorTodayCount.textContent = "0 Appointments";
    dom.doctorWeekCount.textContent = "0 Appointments";
    dom.doctorRecentPatients.textContent = "0 Patients";
    dom.doctorNotification.textContent = "Add doctors using the SQL seed data.";
    dom.doctorProfileLine.textContent = "Doctor profile not selected.";
    dom.doctorAppointments.innerHTML = `<div class="empty-state">No doctor selected.</div>`;
    return;
  }

  dom.doctorDashboardSelect.value = doctor.doctor_id;
  dom.doctorProfileLine.textContent = `${doctor.name} | ${doctor.specialization} | ${doctor.availability_status}`;

  const today = getToday();
  const weekEnd = addDays(today, 6);
  const doctorAppointments = state.appointments.filter(
    (appointment) => String(appointment.doctor_id) === String(doctor.doctor_id)
  );
  const todayAppointments = doctorAppointments.filter((appointment) => appointment.appointment_date === today);
  const weeklyAppointments = doctorAppointments.filter(
    (appointment) => appointment.appointment_date >= today && appointment.appointment_date <= weekEnd
  );
  const recentPatients = new Set(
    doctorAppointments
      .filter((appointment) => appointment.status !== "cancelled")
      .slice(-10)
      .map((appointment) => appointment.patient_id)
  );
  const scheduledToday = todayAppointments.filter((appointment) => appointment.status === "scheduled").length;

  dom.doctorTodayCount.textContent = `${todayAppointments.length} Appointments`;
  dom.doctorWeekCount.textContent = `${weeklyAppointments.length} Appointments`;
  dom.doctorRecentPatients.textContent = `${recentPatients.size} Patients`;
  dom.doctorNotification.textContent =
    scheduledToday > 0 ? `${scheduledToday} scheduled cases pending today` : "No pending alerts";

  renderDoctorAppointments();
}

function renderDoctorAppointments() {
  const doctorId = state.selectedDoctorId;
  const date = dom.doctorFilterDate.value;
  const status = dom.doctorFilterStatus.value;
  const search = dom.doctorFilterSearch.value.trim().toLowerCase();

  if (!doctorId) {
    dom.doctorAppointments.innerHTML = `<div class="empty-state">Select a doctor profile first.</div>`;
    return;
  }

  const filtered = state.appointments.filter((appointment) => {
    const patientName = appointment.patients?.full_name?.toLowerCase() ?? "";

    return (
      String(appointment.doctor_id) === String(doctorId) &&
      (!date || appointment.appointment_date === date) &&
      (!status || appointment.status === status) &&
      (!search || patientName.includes(search))
    );
  });

  if (!filtered.length) {
    dom.doctorAppointments.innerHTML = `<div class="empty-state">No appointments found for the selected doctor and filters.</div>`;
    return;
  }

  dom.doctorAppointments.innerHTML = filtered
    .map(
      (appointment) => `
        <button class="appointment-card" data-open-patient="${appointment.appointment_id}">
          <div class="appointment-card-header">
            <div>
              <strong>${escapeHtml(appointment.patients?.full_name ?? "Unknown patient")}</strong>
              <p>${formatDate(appointment.appointment_date)} | ${toDisplayTime(appointment.appointment_time)}</p>
            </div>
            <span class="pill ${appointment.status}">${capitalize(appointment.status)}</span>
          </div>
          <p><strong>Type:</strong> ${escapeHtml(appointment.type)}</p>
          <small>${escapeHtml(appointment.notes || "No appointment note added.")}</small>
        </button>
      `
    )
    .join("");

  [...dom.doctorAppointments.querySelectorAll("[data-open-patient]")].forEach((button) => {
    button.addEventListener("click", () => openAppointmentInDoctorPanel(button.dataset.openPatient));
  });
}

async function openAppointmentInDoctorPanel(appointmentId) {
  const appointment = state.appointments.find((entry) => String(entry.appointment_id) === String(appointmentId));
  if (!appointment) {
    return;
  }

  state.selectedDoctorAppointment = appointment;
  state.selectedPatientForDoctor = appointment.patients;
  dom.patientDetailTitle.textContent = appointment.patients?.full_name ?? "Patient record";
  dom.patientDetailEmpty.classList.add("hidden");
  dom.patientDetailContent.classList.remove("hidden");
  dom.notePatientId.value = appointment.patient_id;

  renderPatientBasics(appointment.patients);
  renderPatientMedical(appointment.patients);
  renderPatientHistory(appointment.patient_id);
  await renderPatientNotes(appointment.patient_id);
  activateTab("tab-basic");
  switchRole("doctor-portal");
}

function renderPatientBasics(patient) {
  const basic = [
    ["Name", patient?.full_name ?? "-"],
    ["Age", String(getAge(patient?.dob) ?? "-")],
    ["Gender", patient?.gender ?? "-"],
    ["Contact", patient?.contact_number ?? "-"],
    ["Emergency Contact", patient?.emergency_contact ?? "-"],
    ["DOB", patient?.dob ? formatDate(patient.dob) : "-"],
  ];

  dom.patientBasic.innerHTML = basic.map(detailItemMarkup).join("");
}

function renderPatientMedical(patient) {
  const medical = [
    ["Blood Group", patient?.blood_group ?? "-"],
    ["Allergies", patient?.allergies ?? "None recorded"],
    ["Chronic Conditions", patient?.chronic_conditions ?? "None recorded"],
    ["Current Medications", patient?.current_medications ?? "None recorded"],
  ];

  dom.patientMedical.innerHTML = medical.map(detailItemMarkup).join("");
}

function renderPatientHistory(patientId) {
  const history = state.appointments
    .filter((appointment) => String(appointment.patient_id) === String(patientId))
    .sort((a, b) => {
      const aKey = `${a.appointment_date} ${a.appointment_time}`;
      const bKey = `${b.appointment_date} ${b.appointment_time}`;
      return aKey < bKey ? 1 : -1;
    });

  if (!history.length) {
    dom.patientHistory.innerHTML = `<div class="empty-state">No visit history available.</div>`;
    return;
  }

  dom.patientHistory.innerHTML = history
    .map(
      (appointment) => `
        <div class="history-item">
          <p><strong>${formatDate(appointment.appointment_date)}</strong> | ${toDisplayTime(appointment.appointment_time)}</p>
          <p>${escapeHtml(appointment.doctors?.name ?? "Doctor")} | ${escapeHtml(appointment.type)}</p>
          <small>Status: ${escapeHtml(appointment.status)}${appointment.notes ? ` | ${escapeHtml(appointment.notes)}` : ""}</small>
        </div>
      `
    )
    .join("");
}

async function renderPatientNotes(patientId) {
  const { data, error } = await supabase
    .from("clinical_notes")
    .select(
      `
      *,
      doctors (
        name,
        specialization
      )
    `
    )
    .eq("patient_id", patientId)
    .order("note_date", { ascending: false });

  if (error) {
    showToast(error.message);
    return;
  }

  if (!data?.length) {
    dom.patientNotesList.innerHTML = `<div class="empty-state">No clinical notes yet.</div>`;
    return;
  }

  dom.patientNotesList.innerHTML = data
    .map(
      (note) => `
        <div class="history-item">
          <p><strong>${formatDate(note.note_date)}</strong> | ${escapeHtml(note.doctors?.name ?? "Doctor")}</p>
          <small>${escapeHtml(note.doctors?.specialization ?? "")}</small>
          <p>${escapeHtml(note.notes)}</p>
        </div>
      `
    )
    .join("");
}

async function handleNoteSubmit(event) {
  event.preventDefault();

  const patientId = dom.notePatientId.value;
  const doctorId = state.selectedDoctorId;
  const notes = document.getElementById("clinical-note-text").value.trim();

  if (!patientId || !doctorId || !notes) {
    showToast("Select a patient and enter a clinical note.");
    return;
  }

  const payload = {
    patient_id: patientId,
    doctor_id: doctorId,
    note_date: getToday(),
    notes,
  };

  const { error } = await supabase.from("clinical_notes").insert(payload);

  if (error) {
    showToast(error.message);
    return;
  }

  document.getElementById("clinical-note-text").value = "";
  showToast("Clinical note saved.");
  await renderPatientNotes(patientId);
}

function resetDoctorPatientPanel() {
  dom.patientDetailTitle.textContent = "Select an appointment to view the patient record";
  dom.patientDetailEmpty.classList.remove("hidden");
  dom.patientDetailContent.classList.add("hidden");
  dom.notePatientId.value = "";
  document.getElementById("clinical-note-text").value = "";
}

function detailItemMarkup([label, value]) {
  return `
    <div class="detail-item">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
    </div>
  `;
}

function showToast(message) {
  dom.toast.textContent = message;
  dom.toast.classList.add("visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    dom.toast.classList.remove("visible");
  }, 3200);
}

function formatDate(value) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function toDisplayTime(value) {
  if (!value) {
    return "-";
  }

  const [hours, minutes] = value.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : "";
}

function getToday() {
  return toSqlDate(new Date());
}

function addDays(dateText, numberOfDays) {
  const base = new Date(`${dateText}T00:00:00`);
  base.setDate(base.getDate() + numberOfDays);
  return toSqlDate(base);
}

function toSqlDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getAge(dob) {
  if (!dob) {
    return null;
  }

  const birth = new Date(`${dob}T00:00:00`);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age -= 1;
  }
  return age;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
