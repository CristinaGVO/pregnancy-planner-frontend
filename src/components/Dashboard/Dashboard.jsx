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
  const [profileForm, setProfileForm] = useState({ due_date: "", baby_nickname: "" });

  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ kind: "", text: "" });

  // minimal UI: hide profile form unless needed
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
      showAlert("success", "Saved ✅");
    } catch (err) {
      showAlert("error", err?.message || "Error saving profile");
    }
  };

  return (
    <main className="container">
      {/* TOP BAR (minimal) */}
      <div className="hero" style={{ padding: 14 }}>
        <div className="hero-row" style={{ alignItems: "center" }}>
          <div className="brand">
            <div className="brand-mark">🤰</div>
            <div>
              <div className="brand-title">Pregnancy Planner</div>
              <div className="brand-subtitle">{user?.username}</div>
            </div>
          </div>

          <div className="actions-row">
            <button
              className="primary"
              type="button"
              onClick={() => navigate("/appointments/new")}
            >
              + New
            </button>
            <button type="button" onClick={() => navigate("/appointments")}>
              List
            </button>
          </div>
        </div>
      </div>

      {alert.text ? <div className={`alert ${alert.kind}`}>{alert.text}</div> : null}

      {/* GRID: 3 clean cards */}
      <section className="grid-2" style={{ marginTop: 14 }}>
        {/* Weeks Left */}
        <div className="card soft">
          <div className="section-header" style={{ marginBottom: 8 }}>
            <h3>Timeline</h3>
            <span className="badge mint">Due</span>
          </div>

          {loading ? (
            <p className="muted">Loading...</p>
          ) : weeksLeft === null ? (
            <>
              <p className="muted" style={{ marginBottom: 10 }}>
                Add due date
              </p>
              <button type="button" onClick={() => setShowProfileForm(true)}>
                Set due date
              </button>
            </>
          ) : (
            <>
              <div style={{ display: "flex", gap: 10, alignItems: "baseline" }}>
                <span style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.03em" }}>
                  {weeksLeft}
                </span>
                <span className="muted" style={{ fontWeight: 800 }}>
                  weeks left
                </span>
              </div>

              <div className="muted" style={{ marginTop: 6 }}>
                {dueDateISO}
                {profileForm.baby_nickname ? ` • ${profileForm.baby_nickname}` : ""}
              </div>

              <div className="actions-row" style={{ marginTop: 10 }}>
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

              <div className="actions-row">
                <button className="primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          ) : null}
        </div>

        {/* Next Appointment */}
        <div className="card soft">
          <div className="section-header" style={{ marginBottom: 8 }}>
            <h3>Next</h3>
            <span className="badge peach">Appointment</span>
          </div>

          {loading ? (
            <p className="muted">Loading...</p>
          ) : nextAppointment ? (
            <>
              <div className="strong" style={{ fontSize: 16 }}>
                {nextAppointment.title}
              </div>
              <div className="muted" style={{ marginTop: 6 }}>
                {formatShort(nextAppointment.date_time)}
              </div>

              <div style={{ marginTop: 10, display: "flex", gap: 10, flexWrap: "wrap" }}>
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
                <button className="primary" type="button" onClick={() => navigate("/appointments/new")}>
                  + New
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {/* Quick actions (optional third clean card) */}
      <section className="card soft" style={{ marginTop: 14 }}>
        <div className="section-header" style={{ marginBottom: 8 }}>
          <h3>Quick</h3>
          <span className="badge sky">Actions</span>
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
