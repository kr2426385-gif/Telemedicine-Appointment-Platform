const backendUrl = "https://telemedicine-appointment-platform-fj5ln2zyg.vercel.app";
const views = document.querySelectorAll('.view');
const userInfo = document.getElementById('user-info');
const navHome = document.getElementById('nav-home');
const navDoctors = document.getElementById('nav-doctors');
const navAppointments = document.getElementById('nav-appointments');
const navPrescriptions = document.getElementById('nav-prescriptions');
const navBilling = document.getElementById('nav-billing');
const navMessages = document.getElementById('nav-messages');
const navAuth = document.getElementById('nav-auth');
const homeBookDoctor = document.getElementById('home-book-doctor');
const homeViewAppointments = document.getElementById('home-view-appointments');
const doctorSearch = document.getElementById('doctor-search');
const doctorRefresh = document.getElementById('doctor-refresh');
const doctorSpecialty = document.getElementById('doctor-specialty');
const doctorLocation = document.getElementById('doctor-location');
const doctorsList = document.getElementById('doctors-list');
const doctorProfilePanel = document.getElementById('doctor-profile-panel');
const appointmentsList = document.getElementById('appointments-list');
const appointmentActions = document.getElementById('appointment-actions');
const prescriptionActions = document.getElementById('prescription-actions');
const prescriptionsList = document.getElementById('prescriptions-list');
const billingActions = document.getElementById('billing-actions');
const billingList = document.getElementById('billing-list');
const messageForm = document.getElementById('message-form');
const messageReceiver = document.getElementById('message-receiver');
const messageContent = document.getElementById('message-content');
const messagesList = document.getElementById('messages-list');
const showLogin = document.getElementById('show-login');
const showRegister = document.getElementById('show-register');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const bookingBox = document.getElementById('booking-box');

let selectedDoctor = null;
const responseCache = new Map();
const cacheTtl = 30000;

function getCacheKey(path) {
  const user = getStoredUser();
  return `${user?.id || 'guest'}:${path}`;
}

async function cachedApiRequest(path, options = {}) {
  const key = getCacheKey(path);
  const cached = responseCache.get(key);
  if (!options.force && cached && Date.now() - cached.time < cacheTtl) {
    return cached.data;
  }

  const data = await apiRequest(path);
  responseCache.set(key, { data, time: Date.now() });
  return data;
}

function clearCachedData(match = '') {
  responseCache.forEach((_, key) => {
    if (!match || key.includes(match)) responseCache.delete(key);
  });
}

function setLoading(target, message = 'Loading...') {
  target.innerHTML = `
    <div class="loading-state">
      <span class="spinner"></span>
      <strong>${message}</strong>
    </div>
  `;
}

function setButtonBusy(button, busy, label = 'Loading...') {
  if (!button) return;
  if (busy) {
    button.dataset.originalText = button.textContent;
    button.textContent = label;
    button.disabled = true;
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
  }
}

function prefetchUserData() {
  const user = getStoredUser();
  if (!user) return;

  Promise.allSettled([
    cachedApiRequest('/api/v1/appointments'),
    cachedApiRequest('/api/v1/prescriptions'),
    cachedApiRequest('/api/v1/billings'),
    cachedApiRequest('/api/v1/messages')
  ]);
}

function getDoctorName(doctor) {
  if (!doctor) return 'Unknown';
  if (doctor.user?.name) return doctor.user.name;
  if (doctor.name) return doctor.name;
  return 'Unknown';
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function getStoredUser() {
  const userJson = localStorage.getItem('telemedicineUser');
  return userJson ? JSON.parse(userJson) : null;
}

function getId(value) {
  return value?._id || value?.id || value || '';
}

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[char]));
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : 'Not scheduled';
}

function formatDateTime(value) {
  return value ? new Date(value).toLocaleString() : '';
}

function formatMoney(value) {
  return `Rs ${Number(value || 0).toLocaleString('en-IN')}`;
}

function getStatusClass(status = '') {
  return `status-pill status-${status.toLowerCase()}`;
}

function formatAvailability(value) {
  if (!value) return 'By appointment';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(formatAvailability).filter(Boolean).join(', ') || 'By appointment';
  if (typeof value === 'object') {
    const days = Array.isArray(value.days) ? value.days.join(', ') : value.day || value.days;
    const start = value.startTime || value.start || value.from;
    const end = value.endTime || value.end || value.to;
    const parts = [days, start && end ? `${start}-${end}` : start || end].filter(Boolean);
    return parts.join(' ') || 'By appointment';
  }
  return String(value);
}

const paymentMethods = [
  { name: 'Paytm', code: 'PT', inputLabel: 'Paytm mobile number or UPI ID', placeholder: '9876543210 or name@paytm' },
  { name: 'PhonePe', code: 'PP', inputLabel: 'PhonePe mobile number or UPI ID', placeholder: '9876543210 or name@ybl' },
  { name: 'Google Pay', code: 'GP', inputLabel: 'Google Pay mobile number or UPI ID', placeholder: '9876543210 or name@okaxis' },
  { name: 'UPI', code: 'UP', inputLabel: 'UPI ID', placeholder: 'name@bank' },
  { name: 'Debit / Credit Card', code: 'CD', inputLabel: 'Card number', placeholder: '4111 1111 1111 1111' },
  { name: 'Net Banking', code: 'NB', inputLabel: 'Bank / customer ID', placeholder: 'Select bank or enter customer ID' }
];

function requireLogin(target) {
  const user = getStoredUser();
  if (!user) {
    target.innerHTML = '<p class="empty-state">Please login first.</p>';
    return null;
  }
  return user;
}

function setActiveView(viewId) {
  views.forEach((view) => view.classList.remove('active'));
  document.getElementById(viewId).classList.add('active');
  document.querySelectorAll('.sidebar nav button').forEach((button) => button.classList.remove('active-nav'));
  const activeMap = {
    'home-view': navHome,
    'doctors-view': navDoctors,
    'appointments-view': navAppointments,
    'prescriptions-view': navPrescriptions,
    'billing-view': navBilling,
    'messages-view': navMessages,
    'auth-view': navAuth,
    'booking-view': navDoctors
  };
  activeMap[viewId]?.classList.add('active-nav');
}

function setUserState(user) {
  if (user) {
    userInfo.innerHTML = `
      <div class="user-chip">
        <span>${escapeHtml(user.role)}</span>
        <strong>${escapeHtml(user.name)}</strong>
        <button id="logout-btn" class="secondary">Logout</button>
      </div>
    `;
    document.getElementById('logout-btn').addEventListener('click', () => {
      localStorage.removeItem('telemedicineUser');
      localStorage.removeItem('telemedicineToken');
      setUserState(null);
      renderAppointments();
      setActiveView('home-view');
    });
  } else {
    userInfo.innerHTML = '<span class="guest-chip">Not logged in</span>';
  }
}

function getAuthHeaders() {
  const token = localStorage.getItem('telemedicineToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function apiRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${backendUrl}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
        ...options.headers
      },
      ...options
    });
  } catch (error) {
    throw new Error('Cannot connect to backend. Please make sure the backend is running on http://localhost:5000.');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    if (response.status === 401) {
      localStorage.removeItem('telemedicineUser');
      localStorage.removeItem('telemedicineToken');
      setUserState(null);
    }
    throw new Error(errorBody.message || errorBody.error || `Backend returned ${response.status}`);
  }

  return response.status === 204 ? null : response.json();
}

async function loadDoctors(options = {}) {
  try {
    doctorProfilePanel.innerHTML = '';
    setLoading(doctorsList, 'Loading doctors...');
    const query = new URLSearchParams();
    if (doctorSpecialty.value) query.set('specialty', doctorSpecialty.value);
    if (doctorLocation.value) query.set('location', doctorLocation.value);
    const data = await cachedApiRequest(`/api/v1/doctors?${query.toString()}`, { force: options.force });
    doctorsList.innerHTML = data.count === 0 ? '<p class="empty-state">No doctors found.</p>' : '';

    data.doctors.forEach((doctor) => {
      const doctorName = getDoctorName(doctor);
      const card = document.createElement('div');
      card.className = 'doctor-card';
      card.innerHTML = `
        <div class="profile-top">
          <div class="doctor-avatar">${getInitials(doctorName)}</div>
          <div>
            <h3>${escapeHtml(doctorName)}</h3>
            <p class="meta">${escapeHtml(doctor.specialty)} - ${escapeHtml(doctor.location)}</p>
          </div>
        </div>
        <div class="mini-meta">
          <span>${doctor.experience || 0} yrs exp</span>
          <span>${escapeHtml(doctor.location || 'Online')}</span>
        </div>
        <div class="doctor-metrics">
          <span>Available</span>
          <strong>${escapeHtml(formatAvailability(doctor.availability))}</strong>
        </div>
        <div class="card-actions">
          <button class="primary-btn" data-action="profile">Open Profile</button>
          <button class="secondary" data-action="book">Book Appointment</button>
        </div>
      `;
      card.querySelector('[data-action="profile"]').addEventListener('click', () => openDoctorProfile(doctor));
      card.querySelector('[data-action="book"]').addEventListener('click', () => {
        selectedDoctor = doctor;
        showBookingForm();
      });
      doctorsList.appendChild(card);
    });
  } catch (err) {
    doctorsList.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function renderAppointments() {
  const user = getStoredUser();
  setUserState(user);

  appointmentActions.innerHTML = '';
  appointmentsList.innerHTML = '';

  if (!user) {
    appointmentActions.innerHTML = '<p class="empty-state">Please login to view and book appointments.</p>';
    return;
  }

  async function loadAppointments({ force = false, showLoading = true } = {}) {
    if (showLoading) setButtonBusy(loadButton, true, 'Refreshing...');
    if (showLoading) setLoading(appointmentsList, 'Loading appointments...');
    try {
      const data = await cachedApiRequest('/api/v1/appointments', { force });
      appointmentsList.innerHTML = data.count === 0 ? '<p class="empty-state">No appointments found.</p>' : '';
      data.appointments.forEach((appointment) => {
        const card = document.createElement('div');
        card.className = 'appointment-card';
        card.innerHTML = `
          <div class="card-title-row">
            <h3>${formatDate(appointment.date)} · ${escapeHtml(appointment.time)}</h3>
            <span class="${getStatusClass(appointment.status)}">${appointment.status}</span>
          </div>
          <div class="appointment-people">
            <span><strong>Doctor</strong>${escapeHtml(appointment.doctor?.name || 'N/A')}</span>
            <span><strong>Patient</strong>${escapeHtml(appointment.patient?.name || 'N/A')}</span>
          </div>
          <p class="visit-note">${escapeHtml(appointment.notes || 'No notes provided.')}</p>
        `;
        const actions = document.createElement('div');
        actions.className = 'card-actions';

        if (user.role === 'doctor' && appointment.status === 'pending') {
          const confirmButton = document.createElement('button');
          confirmButton.textContent = 'Confirm Appointment';
          confirmButton.addEventListener('click', async () => {
            try {
              setButtonBusy(confirmButton, true, 'Updating...');
              await updateAppointmentStatus(appointment._id, 'confirmed');
              await loadAppointments({ force: true, showLoading: false });
            } catch (err) {
              appointmentsList.innerHTML = `<p class="error">${err.message}</p>`;
            } finally {
              setButtonBusy(confirmButton, false);
            }
          });
          actions.appendChild(confirmButton);
        }

        if (user.role === 'doctor' && appointment.status === 'confirmed') {
          const completeButton = document.createElement('button');
          completeButton.textContent = 'Mark Completed';
          completeButton.className = 'secondary';
          completeButton.addEventListener('click', async () => {
            try {
              setButtonBusy(completeButton, true, 'Updating...');
              await updateAppointmentStatus(appointment._id, 'completed');
              await loadAppointments({ force: true, showLoading: false });
            } catch (err) {
              appointmentsList.innerHTML = `<p class="error">${err.message}</p>`;
            } finally {
              setButtonBusy(completeButton, false);
            }
          });
          actions.appendChild(completeButton);
        }

        const otherUser = user.role === 'doctor' ? appointment.patient : appointment.doctor;
        if (otherUser) {
          const messageButton = document.createElement('button');
          messageButton.textContent = user.role === 'doctor' ? 'Reply to Patient' : 'Message Doctor';
          messageButton.className = 'secondary';
          messageButton.addEventListener('click', () => openMessages(getId(otherUser)));
          actions.appendChild(messageButton);
        }

        if (user.role === 'doctor' && appointment.patient) {
          const prescriptionButton = document.createElement('button');
          prescriptionButton.textContent = 'Send Prescription';
          prescriptionButton.addEventListener('click', () => showPrescriptionForm(appointment));
          actions.appendChild(prescriptionButton);

          const billingButton = document.createElement('button');
          billingButton.textContent = 'Create Bill';
          billingButton.addEventListener('click', () => showBillingForm(appointment));
          actions.appendChild(billingButton);
        }

        if (actions.children.length) card.appendChild(actions);
        appointmentsList.appendChild(card);
      });
    } catch (err) {
      appointmentsList.innerHTML = `<p class="error">${err.message}</p>`;
    } finally {
      if (showLoading) setButtonBusy(loadButton, false);
    }
  }

  const loadButton = document.createElement('button');
  loadButton.textContent = 'Refresh Appointments';
  loadButton.addEventListener('click', () => loadAppointments({ force: true }));
  appointmentActions.appendChild(loadButton);

  if (user.role === 'patient') {
    const directBook = document.createElement('button');
    directBook.textContent = 'Browse Doctors to Book';
    directBook.className = 'secondary';
    directBook.addEventListener('click', () => setActiveView('doctors-view'));
    appointmentActions.appendChild(directBook);
  }

  loadAppointments();
}

function showBookingForm() {
  setActiveView('booking-view');
  bookingBox.innerHTML = '';
  const userJson = localStorage.getItem('telemedicineUser');
  const user = userJson ? JSON.parse(userJson) : null;

  if (!user) {
    bookingBox.innerHTML = '<p class="empty-state">Please login as a patient before booking an appointment.</p>';
    return;
  }

  if (user.role !== 'patient') {
    bookingBox.innerHTML = '<p class="empty-state">Only patients can book appointments. Please login with a patient account.</p>';
    return;
  }

  if (!selectedDoctor) {
    bookingBox.innerHTML = '<p class="empty-state">Select a doctor first from the Doctors page.</p>';
    return;
  }

  const form = document.createElement('form');
  form.className = 'booking-actions';
  form.innerHTML = `
    <div class="booking-doctor"><strong>Doctor</strong><span>${escapeHtml(getDoctorName(selectedDoctor))} (${escapeHtml(selectedDoctor.specialty)})</span></div>
    <input type="date" id="appointment-date" required />
    <input type="time" id="appointment-time" required />
    <input type="text" id="appointment-notes" placeholder="Reason for appointment or notes" />
    <button type="submit">Book Appointment</button>
  `;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const date = document.getElementById('appointment-date').value;
    const time = document.getElementById('appointment-time').value;
    const notes = document.getElementById('appointment-notes').value;

    if (!date || !time) {
      bookingBox.innerHTML = '<p class="error">Please select a date and time.</p>';
      return;
    }

    try {
      await apiRequest('/api/v1/appointments', {
        method: 'POST',
        body: JSON.stringify({ doctorId: selectedDoctor.user?._id || selectedDoctor.user || selectedDoctor._id, date, time, notes })
      });
      clearCachedData('/api/v1/appointments');
      bookingBox.innerHTML = '<p class="success-state">Appointment booked successfully. Go to My Appointments to refresh the list.</p>';
    } catch (err) {
      bookingBox.innerHTML = `<p class="error">${err.message}</p>`;
    }
  });

  bookingBox.appendChild(form);
}

async function loadPrescriptions({ showLoading = true } = {}) {
  const user = requireLogin(prescriptionsList);
  prescriptionActions.innerHTML = '';
  if (!user) return;

  try {
    if (showLoading) setLoading(prescriptionsList, 'Loading prescriptions...');
    const data = await cachedApiRequest('/api/v1/prescriptions');
    prescriptionsList.innerHTML = data.count === 0 ? '<p class="empty-state">No prescriptions found.</p>' : '';
    data.prescriptions.forEach((prescription) => {
      const card = document.createElement('div');
      card.className = 'prescription-card';
      const medicines = (prescription.medicines || [])
        .map((medicine) => `
          <li>
            <strong>${escapeHtml(medicine.name || 'Medicine')}</strong>
            <span>${escapeHtml(medicine.dosage || 'Dosage not set')} - ${escapeHtml(medicine.frequency || 'Frequency not set')}</span>
          </li>
        `)
        .join('');
      card.innerHTML = `
        <div class="card-title-row document-title">
          <h3>Digital Prescription</h3>
          <span class="status-pill">Sent</span>
        </div>
        <div class="document-meta">
          <span><strong>Doctor</strong>${escapeHtml(prescription.doctor?.name || 'N/A')}</span>
          <span><strong>Patient</strong>${escapeHtml(prescription.patient?.name || 'N/A')}</span>
          <span><strong>Visit</strong>${formatDate(prescription.appointment?.date)} ${prescription.appointment?.time || ''}</span>
        </div>
        <div class="clinical-note">
          <strong>Clinical notes</strong>
          <p>${escapeHtml(prescription.notes)}</p>
        </div>
        <ul class="medicine-list">${medicines || '<li><strong>No medicines listed.</strong><span>Add medicines from a doctor appointment.</span></li>'}</ul>
      `;
      prescriptionsList.appendChild(card);
    });
  } catch (err) {
    prescriptionsList.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function openDoctorProfile(doctor) {
  const user = getStoredUser();
  const doctorName = getDoctorName(doctor);
  const doctorUserId = getId(doctor.user);
  const isOwnDoctorProfile = user?.role === 'doctor' && doctorUserId === user.id;

  doctorProfilePanel.innerHTML = `
    <section class="doctor-profile-panel">
      <div class="profile-top">
        <div class="doctor-avatar large">${getInitials(doctorName)}</div>
        <div>
          <p class="eyebrow">Doctor profile</p>
          <h2>${escapeHtml(doctorName)}</h2>
          <p class="meta">${escapeHtml(doctor.specialty)} - ${escapeHtml(doctor.location)}</p>
        </div>
      </div>
      <div class="profile-facts">
        <div><span>Experience</span><strong>${doctor.experience || 0} years</strong></div>
        <div><span>Availability</span><strong>${escapeHtml(formatAvailability(doctor.availability))}</strong></div>
        <div><span>Email</span><strong>${escapeHtml(doctor.user?.email || 'Not listed')}</strong></div>
      </div>
      <p>${escapeHtml(doctor.bio || 'No biography available.')}</p>
      <div class="card-actions">
        ${user?.role === 'patient' ? '<button id="profile-book">Book Appointment</button>' : ''}
        ${user && doctorUserId && doctorUserId !== user.id ? '<button id="profile-message" class="secondary">Message Doctor</button>' : ''}
      </div>
      <div id="doctor-care-panel"></div>
    </section>
  `;

  document.getElementById('profile-book')?.addEventListener('click', () => {
    selectedDoctor = doctor;
    showBookingForm();
  });

  document.getElementById('profile-message')?.addEventListener('click', () => openMessages(doctorUserId));

  if (isOwnDoctorProfile) {
    await renderDoctorCarePanel();
  }

  doctorProfilePanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function renderDoctorCarePanel({ showLoading = true } = {}) {
  const panel = document.getElementById('doctor-care-panel');
  if (showLoading) panel.innerHTML = '<p class="loading-text">Loading patient appointments...</p>';

  try {
    const data = await cachedApiRequest('/api/v1/appointments');
    const appointments = data.appointments || [];
    panel.innerHTML = `
      <div class="care-console">
        <div>
          <p class="eyebrow">Patient care console</p>
          <h3>Confirm appointments, send prescriptions, create bills, and reply to patients.</h3>
        </div>
        <div class="care-list"></div>
      </div>
    `;

    const careList = panel.querySelector('.care-list');
    careList.innerHTML = appointments.length ? '' : '<p class="empty-state">No patient appointments yet.</p>';

    appointments.forEach((appointment) => {
      const row = document.createElement('div');
      row.className = 'care-row';
      row.innerHTML = `
        <div>
          <strong>${escapeHtml(appointment.patient?.name || 'Patient')}</strong>
          <span>${formatDate(appointment.date)} at ${escapeHtml(appointment.time)} - ${escapeHtml(appointment.notes || 'No visit note')}</span>
        </div>
        <span class="${getStatusClass(appointment.status)}">${appointment.status}</span>
        <div class="care-actions"></div>
      `;

      const actions = row.querySelector('.care-actions');
      if (appointment.status === 'pending') {
        const confirmButton = document.createElement('button');
        confirmButton.textContent = 'Confirm';
        confirmButton.addEventListener('click', async () => {
          try {
            setButtonBusy(confirmButton, true, 'Updating...');
            await updateAppointmentStatus(appointment._id, 'confirmed');
            await renderDoctorCarePanel({ showLoading: false });
          } catch (err) {
            panel.innerHTML = `<p class="error">${err.message}</p>`;
          } finally {
            setButtonBusy(confirmButton, false);
          }
        });
        actions.appendChild(confirmButton);
      }

      if (appointment.status === 'confirmed') {
        const completeButton = document.createElement('button');
        completeButton.textContent = 'Complete Visit';
        completeButton.className = 'secondary';
        completeButton.addEventListener('click', async () => {
          try {
            setButtonBusy(completeButton, true, 'Updating...');
            await updateAppointmentStatus(appointment._id, 'completed');
            await renderDoctorCarePanel({ showLoading: false });
          } catch (err) {
            panel.innerHTML = `<p class="error">${err.message}</p>`;
          } finally {
            setButtonBusy(completeButton, false);
          }
        });
        actions.appendChild(completeButton);
      }

      const prescriptionButton = document.createElement('button');
      prescriptionButton.textContent = 'Send Prescription';
      prescriptionButton.addEventListener('click', () => showPrescriptionForm(appointment));
      actions.appendChild(prescriptionButton);

      const billButton = document.createElement('button');
      billButton.textContent = 'Create Bill';
      billButton.className = 'secondary';
      billButton.addEventListener('click', () => showBillingForm(appointment));
      actions.appendChild(billButton);

      const replyButton = document.createElement('button');
      replyButton.textContent = 'Reply';
      replyButton.className = 'secondary';
      replyButton.addEventListener('click', () => openMessages(getId(appointment.patient)));
      actions.appendChild(replyButton);

      careList.appendChild(row);
    });
  } catch (err) {
    panel.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

async function updateAppointmentStatus(appointmentId, status) {
  await apiRequest(`/api/v1/appointments/${appointmentId}`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
  clearCachedData('/api/v1/appointments');
}

function showPrescriptionForm(appointment) {
  setActiveView('prescriptions-view');
  prescriptionActions.innerHTML = '';
  prescriptionsList.innerHTML = '';

  const form = document.createElement('form');
  form.className = 'tool-form';
  form.innerHTML = `
    <div class="form-header">
      <p class="eyebrow">Send prescription</p>
      <h3>${escapeHtml(appointment.patient?.name || 'Patient')} - ${formatDate(appointment.date)} at ${escapeHtml(appointment.time)}</h3>
    </div>
    <textarea id="prescription-notes" placeholder="Diagnosis, care instructions, tests, and follow-up advice" required></textarea>
    <div class="form-grid">
      <input id="medicine-name" placeholder="Medicine name" />
      <input id="medicine-dosage" placeholder="Dosage" />
      <input id="medicine-frequency" placeholder="Frequency / duration" />
    </div>
    <button type="submit">Send Prescription to Patient</button>
  `;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const medicineName = document.getElementById('medicine-name').value.trim();
      const medicines = medicineName
        ? [{
            name: medicineName,
            dosage: document.getElementById('medicine-dosage').value.trim(),
            frequency: document.getElementById('medicine-frequency').value.trim()
          }]
        : [];

      await apiRequest('/api/v1/prescriptions', {
        method: 'POST',
        body: JSON.stringify({
          appointmentId: appointment._id,
          patientId: getId(appointment.patient),
          notes: document.getElementById('prescription-notes').value.trim(),
          medicines
        })
      });
      clearCachedData('/api/v1/prescriptions');
      await loadPrescriptions({ showLoading: false });
    } catch (err) {
      prescriptionsList.innerHTML = `<p class="error">${err.message}</p>`;
    }
  });

  prescriptionActions.appendChild(form);
}

async function loadBilling({ showLoading = true } = {}) {
  const user = requireLogin(billingList);
  billingActions.innerHTML = '';
  if (!user) return;

  try {
    if (showLoading) setLoading(billingList, 'Loading payments...');
    const data = await cachedApiRequest('/api/v1/billings');
    billingList.innerHTML = data.count === 0 ? '<p class="empty-state">No bills found.</p>' : '';
    data.billings.forEach((bill) => {
      const card = document.createElement('div');
      card.className = 'billing-card';
      card.innerHTML = `
        <div class="card-title-row document-title">
          <h3>Consultation Invoice</h3>
          <span class="${getStatusClass(bill.status)}">${bill.status}</span>
        </div>
        <div class="invoice-amount">${formatMoney(bill.amount)}</div>
        <div class="document-meta">
          <span><strong>Doctor</strong>${escapeHtml(bill.doctor?.name || 'N/A')}</span>
          <span><strong>Patient</strong>${escapeHtml(bill.patient?.name || 'N/A')}</span>
          <span><strong>Appointment</strong>${formatDate(bill.appointment?.date)} ${bill.appointment?.time || ''}</span>
        </div>
        <p>${escapeHtml(bill.description || 'No description.')}</p>
      `;

      if (user.role === 'patient' && bill.status === 'pending') {
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        const payButton = document.createElement('button');
        payButton.textContent = 'Pay Now';
        payButton.addEventListener('click', () => showPaymentPanel(card, bill));
        actions.appendChild(payButton);
        card.appendChild(actions);
      }

      billingList.appendChild(card);
    });
  } catch (err) {
    billingList.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function showPaymentPanel(card, bill) {
  document.querySelector('.payment-modal-backdrop')?.remove();

  const modal = document.createElement('div');
  modal.className = 'payment-modal-backdrop';
  modal.innerHTML = `
    <section class="payment-modal" role="dialog" aria-modal="true" aria-label="Payment checkout">
      <header class="payment-modal-header">
        <div>
          <p class="eyebrow">MediConnect Pay</p>
          <h3>${formatMoney(bill.amount)}</h3>
          <span>Invoice ${escapeHtml(String(bill._id).slice(-6).toUpperCase())}</span>
        </div>
        <button type="button" class="secondary payment-close" aria-label="Close payment checkout">Close</button>
      </header>
      <div class="payment-checkout-shell">
        <aside class="payment-method-sidebar">
          <strong>Payment method</strong>
          <div class="payment-method-grid"></div>
        </aside>
        <div class="payment-detail" id="payment-detail">
          <div class="payment-empty">
            <h4>Select a payment method</h4>
            <p>Choose Paytm, PhonePe, Google Pay, UPI, card, or net banking.</p>
          </div>
        </div>
      </div>
    </section>
  `;

  modal.addEventListener('click', (event) => {
    if (event.target === modal) modal.remove();
  });
  modal.querySelector('.payment-close').addEventListener('click', () => modal.remove());

  const grid = modal.querySelector('.payment-method-grid');
  paymentMethods.forEach((method) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'payment-method';
    button.innerHTML = `<span>${method.code}</span><strong>${method.name}</strong>`;
    button.addEventListener('click', () => {
      modal.querySelectorAll('.payment-method').forEach((item) => item.classList.remove('selected'));
      button.classList.add('selected');
      showPaymentCheckout(modal, bill, method);
    });
    grid.appendChild(button);
  });

  document.body.appendChild(modal);
}

function showPaymentCheckout(modal, bill, method) {
  const detail = modal.querySelector('#payment-detail');
  if (!detail) return;

  const qrText = `${method.name.toUpperCase()}|${formatMoney(bill.amount)}|${String(bill._id).slice(-6)}`;
  detail.innerHTML = `
    <div class="checkout-title">
      <p class="eyebrow">${escapeHtml(method.name)}</p>
      <h4>Complete payment</h4>
      <span class="status-pill status-pending">Pending</span>
    </div>
    <div class="checkout-layout">
      <div class="checkout-form">
        <label>${escapeHtml(method.inputLabel)}
          <input id="payment-identity" placeholder="${escapeHtml(method.placeholder)}" required />
        </label>
        ${method.code === 'CD' ? `
          <div class="form-grid compact">
            <input id="card-expiry" placeholder="MM/YY" />
            <input id="card-cvv" placeholder="CVV" />
          </div>
        ` : ''}
        <button type="button" id="complete-payment">Pay ${formatMoney(bill.amount)}</button>
      </div>
      <div class="qr-panel" aria-label="${escapeHtml(method.name)} QR code">
        <div class="qr-code">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
        <strong>Scan QR</strong>
        <small>${escapeHtml(qrText)}</small>
      </div>
    </div>
    <p class="payment-note">Enter your ID or scan the QR code to continue.</p>
  `;

  detail.querySelector('#complete-payment').addEventListener('click', async () => {
    const identity = detail.querySelector('#payment-identity').value.trim();
    if (!identity) {
      detail.querySelector('.payment-note').innerHTML = '<span class="error">Please enter payment ID details or scan the QR.</span>';
      return;
    }

    modal.classList.add('is-processing');
    detail.querySelector('.payment-note').textContent = `Processing ${method.name} payment...`;
    try {
      await apiRequest(`/api/v1/billings/${bill._id}/pay`, { method: 'PUT' });
      clearCachedData('/api/v1/billings');
      modal.remove();
      await loadBilling({ showLoading: false });
    } catch (err) {
      modal.classList.remove('is-processing');
      detail.querySelector('.payment-note').innerHTML = `<span class="error">${escapeHtml(err.message)}</span>`;
    }
  });
}

function showBillingForm(appointment) {
  setActiveView('billing-view');
  billingActions.innerHTML = '';
  billingList.innerHTML = '';

  const form = document.createElement('form');
  form.className = 'tool-form';
  form.innerHTML = `
    <div class="form-header">
      <p class="eyebrow">Create invoice</p>
      <h3>${escapeHtml(appointment.patient?.name || 'Patient')} - ${formatDate(appointment.date)} at ${escapeHtml(appointment.time)}</h3>
    </div>
    <input type="number" id="bill-amount" min="0" placeholder="Consultation amount" required />
    <input id="bill-description" placeholder="Description" value="Telemedicine consultation and care management" />
    <button type="submit">Send Bill to Patient</button>
  `;

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await apiRequest(`/api/v1/billings/from-appointment/${appointment._id}`, {
        method: 'POST',
        body: JSON.stringify({
          amount: Number(document.getElementById('bill-amount').value),
          description: document.getElementById('bill-description').value.trim()
        })
      });
      clearCachedData('/api/v1/billings');
      await loadBilling({ showLoading: false });
    } catch (err) {
      billingList.innerHTML = `<p class="error">${err.message}</p>`;
    }
  });

  billingActions.appendChild(form);
}

async function loadMessageContacts(selectedId = '') {
  messageReceiver.innerHTML = '';

  try {
    const user = getStoredUser();
    const contacts = new Map();

    const [doctorsData, appointmentData] = await Promise.all([
      cachedApiRequest('/api/v1/doctors'),
      user ? cachedApiRequest('/api/v1/appointments') : Promise.resolve({ appointments: [] })
    ]);

    doctorsData.doctors.forEach((doctor) => {
      if (doctor.user && getId(doctor.user) !== user?.id) {
        contacts.set(getId(doctor.user), `${doctor.user.name} (${doctor.specialty})`);
      }
    });

    if (user) {
      appointmentData.appointments.forEach((appointment) => {
        const other = user.role === 'doctor' ? appointment.patient : appointment.doctor;
        if (other) contacts.set(getId(other), other.name);
      });
    }

    contacts.forEach((label, id) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = label;
      if (id === selectedId) option.selected = true;
      messageReceiver.appendChild(option);
    });

    if (!messageReceiver.children.length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No contacts found';
      messageReceiver.appendChild(option);
    }
  } catch (err) {
    const option = document.createElement('option');
    option.value = '';
    option.textContent = err.message;
    messageReceiver.appendChild(option);
  }
}

async function loadMessages(selectedId = '', { showLoading = true } = {}) {
  const user = requireLogin(messagesList);
  if (!user) return;

  if (showLoading) setLoading(messagesList, 'Loading messages...');
  await loadMessageContacts(selectedId);

  try {
    const data = await cachedApiRequest('/api/v1/messages');
    messagesList.innerHTML = data.count === 0 ? '<p class="empty-state">No messages yet.</p>' : '';
    data.messages.forEach((message) => {
      const card = document.createElement('div');
      card.className = 'message-card';
      card.innerHTML = `
        <div class="card-title-row message-title">
          <h3>${escapeHtml(message.sender?.name || 'Unknown')} to ${escapeHtml(message.receiver?.name || 'Unknown')}</h3>
          <span class="message-time">${formatDateTime(message.createdAt)}</span>
        </div>
        <p class="message-body">${escapeHtml(message.content)}</p>
      `;
      const otherPerson = getId(message.sender) === user.id ? message.receiver : message.sender;
      if (otherPerson) {
        const actions = document.createElement('div');
        actions.className = 'card-actions';
        const replyButton = document.createElement('button');
        replyButton.textContent = 'Reply';
        replyButton.className = 'secondary';
        replyButton.addEventListener('click', () => {
          messageReceiver.value = getId(otherPerson);
          messageContent.focus();
        });
        actions.appendChild(replyButton);
        card.appendChild(actions);
      }
      messagesList.appendChild(card);
    });
  } catch (err) {
    messagesList.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

function openMessages(receiverId) {
  setActiveView('messages-view');
  loadMessages(receiverId);
}

function setupAuthForms() {
  showLogin.addEventListener('click', () => {
    showLogin.classList.add('active');
    showRegister.classList.remove('active');
    loginForm.classList.add('active');
    registerForm.classList.remove('active');
  });

  showRegister.addEventListener('click', () => {
    showLogin.classList.remove('active');
    showRegister.classList.add('active');
    loginForm.classList.remove('active');
    registerForm.classList.add('active');
  });

  loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const email = document.getElementById('login-email').value.trim().toLowerCase();
      const password = document.getElementById('login-password').value;
      const data = await apiRequest('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      clearCachedData();
      localStorage.setItem('telemedicineUser', JSON.stringify(data.user));
      localStorage.setItem('telemedicineToken', data.token);
      setUserState(data.user);
      prefetchUserData();
      setActiveView('home-view');
    } catch (err) {
      alert(err.message);
    }
  });

  registerForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      const name = document.getElementById('register-name').value;
      const email = document.getElementById('register-email').value.trim().toLowerCase();
      const password = document.getElementById('register-password').value;
      const role = document.getElementById('register-role').value;
      const data = await apiRequest('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      });
      clearCachedData();
      localStorage.setItem('telemedicineUser', JSON.stringify(data.user));
      localStorage.setItem('telemedicineToken', data.token);
      setUserState(data.user);
      prefetchUserData();
      setActiveView('home-view');
    } catch (err) {
      alert(err.message);
    }
  });
}

function setupMessageForm() {
  messageForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    try {
      await apiRequest('/api/v1/messages', {
        method: 'POST',
        body: JSON.stringify({
          receiverId: messageReceiver.value,
          content: messageContent.value.trim()
        })
      });
      clearCachedData('/api/v1/messages');
      messageContent.value = '';
      await loadMessages(messageReceiver.value, { showLoading: false });
    } catch (err) {
      messagesList.innerHTML = `<p class="error">${err.message}</p>`;
    }
  });
}

function setupNavigation() {
  document.querySelectorAll('[data-module]').forEach((button) => {
    button.addEventListener('click', () => {
      const viewId = button.dataset.module;
      setActiveView(viewId);
      if (viewId === 'doctors-view') loadDoctors();
      if (viewId === 'appointments-view') renderAppointments();
      if (viewId === 'prescriptions-view') loadPrescriptions();
      if (viewId === 'billing-view') loadBilling();
      if (viewId === 'messages-view') loadMessages();
    });
  });

  homeBookDoctor.addEventListener('click', () => {
    setActiveView('doctors-view');
    loadDoctors();
  });
  homeViewAppointments.addEventListener('click', () => {
    setActiveView('appointments-view');
    renderAppointments();
  });
  navHome.addEventListener('click', () => setActiveView('home-view'));
  navDoctors.addEventListener('click', () => {
    setActiveView('doctors-view');
    loadDoctors();
  });
  navAppointments.addEventListener('click', () => {
    setActiveView('appointments-view');
    renderAppointments();
  });
  navPrescriptions.addEventListener('click', () => {
    setActiveView('prescriptions-view');
    loadPrescriptions();
  });
  navBilling.addEventListener('click', () => {
    setActiveView('billing-view');
    loadBilling();
  });
  navMessages.addEventListener('click', () => {
    setActiveView('messages-view');
    loadMessages();
  });
  navAuth.addEventListener('click', () => setActiveView('auth-view'));
  doctorSearch.addEventListener('click', async () => {
    setButtonBusy(doctorSearch, true, 'Searching...');
    await loadDoctors({ force: true });
    setButtonBusy(doctorSearch, false);
  });
  doctorRefresh.addEventListener('click', async () => {
    doctorSpecialty.value = '';
    doctorLocation.value = '';
    setButtonBusy(doctorRefresh, true, 'Refreshing...');
    await loadDoctors({ force: true });
    setButtonBusy(doctorRefresh, false);
  });
}

function init() {
  const userJson = localStorage.getItem('telemedicineUser');
  const user = userJson ? JSON.parse(userJson) : null;
  setUserState(user);
  setupNavigation();
  setupAuthForms();
  setupMessageForm();
  setActiveView('home-view');
  loadDoctors();
  prefetchUserData();
}

init();
