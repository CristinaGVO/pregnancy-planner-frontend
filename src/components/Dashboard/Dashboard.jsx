import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { UserContext } from "../../contexts/UserContext";
import { getAppointments } from "../../services/appointmentsService";
import {
  getProfile,
  createProfile,
  updateProfile,
} from "../../services/pregnancyProfileService";

function parseDateTime(dt) {
  if (!dt) return null;

  const direct = new Date(dt);
  if (!Number.isNaN(direct.getTime())) return direct;

  const s = String(dt).replace(" ", "T");
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatShort(dt) {
  const d = parseDateTime(dt);
  if (!d) return String(dt);
  return d.toLocaleString();
}

function toDateInputValue(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function isErrorPayload(x) {
  return x && typeof x === "object" && (x.error || x.err);
}

export default function Dashboard() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    due_date: "",
    baby_nickname: "",
  });

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ kind: "", text: "" });
  const [showProfileForm, setShowProfileForm] = useState(false);

  const showAlert = (kind, text) => setAlert({ kind, text });

  async function refreshData() {
    try {
      setLoading(true);
      setAlert({ kind: "", text: "" });

      const token = localStorage.getItem("token");

      const apptData = await getAppointments(token);
      if (isErrorPayload(apptData)) throw new Error(apptData.error || apptData.err);
      setAppointments(Array.isArray(apptData) ? apptData : []);

      const prof = await getProfile(token);

      // Si el backend devuelve 404 con {error}, lo tratamos como "sin perfil"
      if (!prof || isErrorPayload(prof)) {
        setProfile(null);
        setProfileForm({ due_date: "", baby_nickname: "" });
      } else {
        setProfile(prof);
        setProfileForm({
          due_date: toDateInputValue(prof.due_date),
          baby_nickname: prof.baby_nickname || "",
        });
      }
    } catch (err) {
      showAlert("error", err?.message || "Error loading dashboard");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
      return;
    }
    refreshData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const dueDateISO = useMemo(() => {
    if (profileForm.due_date) return profileForm.due_date;
    return profile ? toDateInputValue(profile.due_date) : "";
  }, [profileForm.due_date, profile]);

  const weeksLeft = useMemo(() => {
    if (!dueDateISO) return null;

    const due = new Date(`${dueDateISO}T00:00:00`);
    if (Number.isNaN(due.getTime())) return null;

    const today = new Date();
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const w = Math.ceil(diffDays / 7);

    if (!Number.isFinite(w)) return null;
    return Math.max(0, w);
  }, [dueDateISO]);

  const sortedAppointments = useMemo(() => {
    const copy = [...appointments];
    copy.sort((a, b) => {
      const da = parseDateTime(a.date_time)?.getTime() ?? 0;
      const db = parseDateTime(b.date_time)?.getTime() ?? 0;
      return da - db;
    });
    return copy;
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    const now = new Date();

    const upcoming = sortedAppointments
      .map((a) => {
        const d = parseDateTime(a.date_time);
        const status = String(a.status ?? "scheduled").toLowerCase().trim();
        return { a, d, status };
      })
      .filter(({ d, status }) => d && d >= now && status === "scheduled")
      .sort((x, y) => x.d - y.d);

    return upcoming.length ? upcoming[0].a : null;
  }, [sortedAppointments]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setAlert({ kind: "", text: "" });

    try {
      const token = localStorage.getItem("token");
      if (!profileForm.due_date) throw new Error("Select a due date");

      const payload = {
        due_date: profileForm.due_date,
        baby_nickname: profileForm.baby_nickname || null,
      };

      const result = profile
        ? await updateProfile(token, payload)
        : await createProfile(token, payload);

      if (isErrorPayload(result)) throw new Error(result.error || result.err);

      setProfile(result);
      setProfileForm({
        due_date: toDateInputValue(result.due_date),
        baby_nickname: result.baby_nickname || "",
      });

      setShowProfileForm(false);
      showAlert("success", "Saved");
    } catch (err) {
      showAlert("error", err?.message || "Error saving profile");
    }
  };

  // Provider name (tu nuevo campo) con fallback por si hay data vieja
  const nextProvider =
    nextAppointment?.provider_name ?? nextAppointment?.doctor_name ?? "";

  return (
    <main className="container">
      {/* HERO */}
      <header className="hero hero-lg">
        <div className="hero-row hero-row-center">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              {/* Simple, clean, “app-like” logo */}
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 21s-7-4.4-9.4-9C.5 7.7 3.1 4.5 6.5 4.5c1.9 0 3.3 1 4.1 2 0.8-1 2.2-2 4.1-2 3.4 0 6 3.2 3.9 7.5C19 16.6 12 21 12 21Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M9.2 10.5c1.6-1.2 3.9-1.2 5.6 0"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            <div>
              <div className="brand-title brand-title-purple">
                Pregnancy Planner
              </div>
              <div className="brand-subtitle">{user?.username}</div>
            </div>
          </div>

          {/* (Opcional) aquí podrías poner un botón de “Settings” en el futuro */}
          <div className="actions-row buttons-equal"></div>
        </div>
      </header>

      {alert.text ? <div className={`alert ${alert.kind}`}>{alert.text}</div> : null}

      {/* 2 cards arriba */}
      <section className="grid-2 dashboard-grid">
        {/* DUE DATE */}
        <div className="card soft card-lg">
          <div className="section-header section-header-lg">
            <h3>Due date</h3>
            <span className="badge">Timeline</span>
          </div>

          {loading ? (
            <p className="muted">Loading...</p>
          ) : weeksLeft === null ? (
            <>
              <p className="muted">Add your due date to see your timeline.</p>
              <div className="actions-row buttons-equal">
                <button type="button" onClick={() => setShowProfileForm(true)}>
                  Set due date
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="metric">
                <span className="metric-number">{weeksLeft}</span>
                <span className="muted strong">weeks left</span>
              </div>

              <div className="muted metric-sub">
                {dueDateISO}
                {profileForm.baby_nickname ? ` • ${profileForm.baby_nickname}` : ""}
              </div>

              <div className="actions-row buttons-equal">
                <button type="button" onClick={() => setShowProfileForm((v) => !v)}>
                  {showProfileForm ? "Close" : "Edit"}
                </button>
              </div>
            </>
          )}

          {showProfileForm ? (
            <form className="form-grid form-panel" onSubmit={handleProfileSubmit}>
              <div className="grid-2">
                <div>
                  <label>Due Date</label>
                  <input
                    type="date"
                    value={profileForm.due_date}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, due_date: e.target.value }))
                    }
                    required
                  />
                </div>

                <div>
                  <label>Baby Nickname</label>
                  <input
                    value={profileForm.baby_nickname}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, baby_nickname: e.target.value }))
                    }
                    placeholder="optional"
                  />
                </div>
              </div>

              <div className="actions-row buttons-equal">
                <button type="submit">Save</button>
              </div>
            </form>
          ) : null}
        </div>

        {/* NEXT APPOINTMENT */}
        <div className="card soft card-lg">
          <div className="section-header section-header-lg">
            <h3>Next appointment</h3>
            <span className="badge">Upcoming</span>
          </div>

          {loading ? (
            <p className="muted">Loading...</p>
          ) : nextAppointment ? (
            <>
              <div className="strong appt-title">{nextAppointment.title}</div>
              <div className="muted">{formatShort(nextAppointment.date_time)}</div>

              <div className="tags-row">
                {nextProvider ? (
                  <span className="badge">Provider: {nextProvider}</span>
                ) : null}
                {nextAppointment.appointment_type ? (
                  <span className="badge">{nextAppointment.appointment_type}</span>
                ) : null}
              </div>

              <div className="actions-row buttons-equal">
                <button
                  type="button"
                  onClick={() => navigate(`/appointments/${nextAppointment.id}/edit`)}
                >
                  Edit
                </button>
                <button type="button" onClick={() => navigate("/appointments")}>
                  View all
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="muted">No upcoming scheduled appointments.</p>
              <div className="actions-row buttons-equal">
                <button type="button" onClick={() => navigate("/appointments/new")}>
                  New appointment
                </button>
                <button type="button" onClick={() => navigate("/appointments")}>
                  View all
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section className="card soft card-lg" style={{ marginTop: 16 }}>
        <div className="section-header section-header-lg">
          <h3>Appointments</h3>
          <span className="badge">Actions</span>
        </div>

        <div className="actions-row buttons-equal">
          <button type="button" onClick={() => navigate("/appointments/new")}>
            New appointment
          </button>
          <button type="button" onClick={() => navigate("/appointments")}>
            View appointments
          </button>
        </div>
      </section>
    </main>
  );
}
