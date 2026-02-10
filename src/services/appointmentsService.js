const BASE_URL = import.meta.env.VITE_BACK_END_SERVER_URL;

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getAppointments(token) {
  const res = await fetch(`${BASE_URL}/appointments`, {
    headers: authHeader(token),
  });
  return res.json();
}

export async function createAppointment(token, appointment) {
  const res = await fetch(`${BASE_URL}/appointments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(appointment),
  });
  return res.json();
}

export async function getAppointmentById(token, id) {
  const res = await fetch(`${BASE_URL}/appointments/${id}`, {
    headers: authHeader(token),
  });
  return res.json();
}

export async function updateAppointment(token, id, appointment) {
  const res = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(appointment),
  });
  return res.json();
}

export async function deleteAppointment(token, id) {
  const res = await fetch(`${BASE_URL}/appointments/${id}`, {
    method: "DELETE",
    headers: authHeader(token),
  });
  return res.json();
}
