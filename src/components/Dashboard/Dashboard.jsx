import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { UserContext } from "../../contexts/UserContext";
import { getAppointments } from "../../services/appointmentsService";
import {
  getProfile,
  createProfile,
  updateProfile,
} from "../../services/pregnancyProfileService";

// Parse LOCAL (evita que 1:00pm se vuelva 5:00am por timezone)
function parseLocalDateTime(dt) {
  if (!dt) return null;
  const s = String(dt);

  // "YYYY-MM-DD HH:MM:SS" o "YYYY-MM-DDTHH:MM:SS"
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/);
  if (m) {
    const [, y, mo, d, hh, mm, ss] = m;
    return new Date(
      Number(y),
      Number(mo) - 1,
      Number(d),
      Number(hh),
      Number(mm),
      Number(ss || 0)
    );
  }

  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatDateOnly(dt) {
  const d = parseLocalDateTime(dt);
  if (!d) return "";
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimeOnly(dt) {
  const d = parseLocalDateTime(dt);
  if (!d) return "";
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
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
  const [profileForm, setProfileForm] = useState({ due_date: "", baby_nickname: "" });

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
      const da = parseLocalDateTime(a.date_time)?.getTime() ?? 0;
      const db = parseLocalDateTime(b.date_time)?.getTime() ?? 0;
      return da - db;
    });
    return copy;
  }, [appointments]);

  const nextAppointment = useMemo(() => {
    const now = new Date();

    const upcoming = sortedAppointments
      .map((a) => {
        const d = parseLocalDateTime(a.date_time);
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
      if (!profileForm.due_date) throw new Error("Please select a due date.");

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
      showAlert("success", "Saved ✅");
    } catch (err) {
      showAlert("error", err?.message || "Error saving profile");
    }
  };

  return (
    <main className="container">
      {/* Header */}
      <div className="hero" style={{ padding: 14 }}>
        <div className="hero-row" style={{ alignItems: "center" }}>
          <div className="brand">
            <div>
              <div className="brand-title">Your Pregnancy Planner</div>
              <div className="brand-subtitle">{user?.username}</div>
            </div>
          </div>
        </div>
      </div>

      {alert.text ? <div className={`alert ${alert.kind}`}>{alert.text}</div> : null}

      {/* Two cards (same size) */}
      <section className="grid-2 dashboard-grid" style={{ marginTop: 14 }}>
        {/* Due date */}
        <div className="card soft dashboard-card">
          <div className="section-header" style={{ marginBottom: 12 }}>
            <h3>Due date</h3>
          </div>

          {loading ? (
            <p className="muted">Loading...</p>
          ) : weeksLeft === null ? (
            <>
              <p className="muted">Add your due date to see your timeline.</p>
              <div className="actions-row" style={{ marginTop: 10 }}>
                <button type="button" onClick={() => setShowProfileForm(true)}>
                  Set due date
                </button>
              </div>
            </>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ fontSize: 30, fontWeight: 900, letterSpacing: "-0.03em" }}>
                  {weeksLeft}
                </span>
                <span className="muted dashboard-smallText" style={{ fontWeight: 800 }}>
                  weeks left for meet with your Baby
                </span>
              </div>

              <div className="muted dashboard-smallText" style={{ marginTop: 8 }}>
                Due: <span className="strong">{dueDateISO}</span>
                {profileForm.baby_nickname ? ` • ${profileForm.baby_nickname}` : ""}
              </div>

              <div className="actions-row" style={{ marginTop: 12 }}>
                <button type="button" onClick={() => setShowProfileForm((v) => !v)}>
                  {showProfileForm ? "Close" : "Edit"}
                </button>
              </div>
            </>
          )}

          {showProfileForm ? (
            <form className="form-grid" onSubmit={handleProfileSubmit} style={{ marginTop: 12 }}>
              <div className="grid-2">
                <div>
                  <label>Due date</label>
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
                  <label>Baby nickname (optional)</label>
                  <input
                    value={profileForm.baby_nickname}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, baby_nickname: e.target.value }))
                    }
                    placeholder="optional"
                  />
                </div>
              </div>

              <div className="actions-row">
                <button className="primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {/* Next appointment */}
        <div className="card soft dashboard-card">
          <div className="section-header" style={{ marginBottom: 12 }}>
            <h3>Next appointment</h3>
          </div>

          {loading ? (
            <p className="muted">Loading...</p>
          ) : nextAppointment ? (
            <>
              <div className="strong dashboard-titleText">{nextAppointment.title}</div>

              {/* Date + Time separated */}
              <div className="muted dashboard-smallText" style={{ marginTop: 10 }}>
                <div>
                  <span className="strong">Date:</span> {formatDateOnly(nextAppointment.date_time)}
                </div>
                <div>
                  <span className="strong">Time:</span> {formatTimeOnly(nextAppointment.date_time)}
                </div>
              </div>

              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                {nextAppointment.doctor_name ? (
                  <span className="badge sky">Provider: {nextAppointment.doctor_name}</span>
                ) : null}
                {nextAppointment.appointment_type ? (
                  <span className="badge mint">{nextAppointment.appointment_type}</span>
                ) : null}
              </div>

              <div className="actions-row" style={{ marginTop: 12 }}>
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
              <div className="actions-row" style={{ marginTop: 10 }}>
                <button
                  className="primary"
                  type="button"
                  onClick={() => navigate("/appointments/new")}
                >
                  + New appointment
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Keep your existing bottom card */}
      <section className="card soft" style={{ marginTop: 14 }}>
        <div className="section-header" style={{ marginBottom: 8 }}>
          <h3>Appointments</h3>
        </div>

        <div className="actions-row">
          <button className="primary" type="button" onClick={() => navigate("/appointments/new")}>
            + New appointment
          </button>
          <button type="button" onClick={() => navigate("/appointments")}>
            View appointments
          </button>
        </div>
      </section>
    </main>
  );
}
