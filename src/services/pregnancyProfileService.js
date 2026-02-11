const BASE_URL = import.meta.env.VITE_BACK_END_SERVER_URL;

function authHeader(token) {
  return { Authorization: `Bearer ${token}` };
}

export async function getProfile(token) {
  const res = await fetch(`${BASE_URL}/profile`, {
    headers: authHeader(token),
  });
  return res.json();
}

export async function createProfile(token, profile) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(profile),
  });
  return res.json();
}

export async function updateProfile(token, profile) {
  const res = await fetch(`${BASE_URL}/profile`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      ...authHeader(token),
    },
    body: JSON.stringify(profile),
  });
  return res.json();
}
