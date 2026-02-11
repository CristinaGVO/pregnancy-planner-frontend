import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { UserContext } from "../../contexts/UserContext";

import {
  getAppointments,
  createAppointment,
  deleteAppointment,
} from "../../services/appointmentsService";

import {
  getProfile,
  createProfile,
  updateProfile,
} from "../../services/pregnancyProfileService";

const STATUS_OPTIONS = ["scheduled", "completed", "canceled"];

function parseDateTime(dt) {
  if (!dt) return null;

  // 1) Try direct parse first (handles RFC strings)
  const direct = new Date(dt);
  if (!Number.isNaN(direct.getTime())) return direct;

  // 2) Fallback for "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
  const s = String(dt).replace(" ", "T");
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatShort(dt) {
  const d = parseDateTime(dt);
  if (!d) return String(dt);
  return d.toLocaleString();
}

// backend -> input[type=date] needs "YYYY-MM-DD"
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
  const [filter, setFilter] = useState("upcoming"); // all | upcoming | past
  const [loading, setLoading] = useState(true);

  // nicer alerts
  const [alert, setAlert] = useState({ kind: "", text: "" });
  const showAlert = (kind, text) => setAlert({ kind, text });

  // pregnancy profile
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    due_date: "",
    baby_nickname: "",
  });

  // appointment create form
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    provider_name: "",
    appointment_type: "",
    status: "scheduled",
    location: "",
    notes: "",
  });

  async function refreshData() {
    try {
      setLoading(true);
      setAlert({ kind: "", text: "" });

      const token = localStorage.getItem("token");

      // appointments
      const apptData = await getAppointments(token);
      if (isErrorPayload(apptData)) throw new Error(apptData.error || apptData.err);

      setAppointments(Array.isArray(apptData) ? apptData : []);

      // profile
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
    } catch (error) {
      showAlert("error", error?.message || "Error loading data");
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

  const filteredAppointments = useMemo(() => {
    const now = new Date();
    if (filter === "all") return sortedAppointments;

    return sortedAppointments.filter((a) => {
      const d = parseDateTime(a.date_time);
      if (!d) return false;
      return filter === "upcoming" ? d >= now : d < now;
    });
  }, [sortedAppointments, filter]);

  // ✅ FIXED: Next appointment now handles parsing + status normalization robustly
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

  const handleChange = (e) => {
    setAlert({ kind: "", text: "" });
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();
    setAlert({ kind: "", text: "" });

    try {
      if (!formData.date || !formData.time) {
        throw new Error("Please select date and time");
      }

      const token = localStorage.getItem("token");

      // NOTE: backend expects doctor_name (per your current DB/API)
      const payload = {
        title: formData.title,
        date_time: `${formData.date} ${formData.time}:00`,
        doctor_name: formData.provider_name || null, // mapped to backend field
        appointment_type: formData.appointment_type || null,
        status: formData.status || "scheduled",
        location: formData.location || null,
        notes: formData.notes || null,
      };

      const created = await createAppointment(token, payload);
      if (isErrorPayload(created)) throw new Error(created.error || created.err);

      await refreshData();

      setFormData({
        title: "",
        date: "",
        time: "",
        provider_name: "",
        appointment_type: "",
        status: "scheduled",
        location: "",
        notes: "",
      });

      showAlert("success", "Appointment created ✅");
    } catch (error) {
      showAlert("error", error?.message || "Error creating appointment");
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this appointment?");
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      const deleted = await deleteAppointment(token, id);
      if (isErrorPayload(deleted)) throw new Error(deleted.error || deleted.err);

      await refreshData();
      showAlert("success", "Appointment deleted ✅");
    } catch (error) {
      showAlert("error", error?.message || "Error deleting appointment");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setAlert({ kind: "", text: "" });

    try {
      const token = localStorage.getItem("token");

      if (!profileForm.due_date) {
        throw new Error("Please select a due date");
      }

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

      showAlert("success", profile ? "Profile updated ✅" : "Profile saved ✅");
    } catch (error) {
      showAlert("error", error?.message || "Error saving profile");
    }
  };

  return (
    <div className="container">
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="muted">
            Track appointments and your pregnancy timeline in one place.
          </p>
        </div>
        <span className="badge sky">Logged in</span>
      </div>

      {alert.text && <div className={`alert ${alert.kind}`}>{alert.text}</div>}

      {/* Pregnancy Profile */}
      <section className="card">
        <div className="card-title">
          <h3>Pregnancy</h3>
          <span className="badge mint">Due Date</span>
        </div>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : profile ? (
          <>
            {weeksLeft !== null ? (
              <p className="lead">
                <b>{weeksLeft}</b> weeks left{" "}
                <span className="muted">• due {dueDateISO}</span>
                {profileForm.baby_nickname ? (
                  <span className="muted"> • {profileForm.baby_nickname}</span>
                ) : null}
              </p>
            ) : (
              <p className="muted">Add a valid due date to calculate weeks left.</p>
            )}

            <form className="form-grid" onSubmit={handleProfileSubmit}>
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
                  <label>Baby Nickname (optional)</label>
                  <input
                    value={profileForm.baby_nickname}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        baby_nickname: e.target.value,
                      }))
                    }
                    placeholder="e.g. Peanut"
                  />
                </div>
              </div>

              <div className="actions-row">
                <button className="primary" type="submit">
                  Save Profile
                </button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p className="muted">Add your due date to see weeks left.</p>

            <form className="form-grid" onSubmit={handleProfileSubmit}>
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
                  <label>Baby Nickname (optional)</label>
                  <input
                    value={profileForm.baby_nickname}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        baby_nickname: e.target.value,
                      }))
                    }
                    placeholder="e.g. Peanut"
                  />
                </div>
              </div>

              <div className="actions-row">
                <button className="primary" type="submit">
                  Save
                </button>
              </div>
            </form>
          </>
        )}
      </section>

      {/* Next Appointment */}
      <section className="card">
        <div className="card-title">
          <h3>Next Appointment</h3>
          <span className="badge peach">Upcoming</span>
        </div>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : nextAppointment ? (
          <div className="next-appt">
            <div>
              <div className="strong">{nextAppointment.title}</div>
              <div className="muted">{formatShort(nextAppointment.date_time)}</div>
              {nextAppointment.doctor_name ? (
                <div className="muted">Provider: {nextAppointment.doctor_name}</div>
              ) : null}
              {nextAppointment.appointment_type ? (
                <div className="muted">Type: {nextAppointment.appointment_type}</div>
              ) : null}
              <div className="muted">
                Status: {String(nextAppointment.status ?? "scheduled")}
              </div>
            </div>

            <div className="actions-col">
              <button
                type="button"
                onClick={() => navigate(`/appointments/${nextAppointment.id}/edit`)}
              >
                Edit
              </button>
            </div>
          </div>
        ) : (
          <p className="muted">No upcoming scheduled appointments.</p>
        )}
      </section>

      {/* Create Appointment */}
      <section className="card">
        <div className="card-title">
          <h3>Create Appointment</h3>
          <span className="badge sky">Add</span>
        </div>

        <form className="form-grid" onSubmit={handleCreateAppointment}>
          <div>
            <label>Title</label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              placeholder="e.g. OB Visit"
            />
          </div>

          <div className="grid-2">
            <div>
              <label>Date</label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <label>Time</label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label>Provider Name</label>
              <input
                name="provider_name"
                value={formData.provider_name}
                onChange={handleChange}
                placeholder="e.g. Dr. Martinez"
              />
            </div>

            <div>
              <label>Appointment Type</label>
              <input
                name="appointment_type"
                value={formData.appointment_type}
                onChange={handleChange}
                placeholder="e.g. Ultrasound, Lab, Class..."
              />
            </div>
          </div>

          <div className="grid-2">
            <div>
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Location</label>
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g. UW Medicine"
              />
            </div>
          </div>

          <div>
            <label>Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Anything you want to remember..."
              rows={3}
            />
          </div>

          <div className="actions-row">
            <button className="primary" type="submit">
              Create
            </button>
          </div>
        </form>
      </section>

      {/* Filters */}
      <div className="filters">
        <div className="chips">
          <span className="muted strong">Filter:</span>
          <button
            type="button"
            className={`chip ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>
          <button
            type="button"
            className={`chip ${filter === "upcoming" ? "active" : ""}`}
            onClick={() => setFilter("upcoming")}
          >
            Upcoming
          </button>
          <button
            type="button"
            className={`chip ${filter === "past" ? "active" : ""}`}
            onClick={() => setFilter("past")}
          >
            Past
          </button>
        </div>
      </div>

      {/* Appointments List */}
      <section className="card">
        <div className="card-title">
          <h3>Appointments</h3>
          <span className="badge pink">{filteredAppointments.length}</span>
        </div>

        {loading ? (
          <p className="muted">Loading...</p>
        ) : filteredAppointments.length === 0 ? (
          <p className="muted">No appointments for this filter.</p>
        ) : (
          <div className="list">
            {filteredAppointments.map((a) => (
              <div key={a.id} className="list-item">
                <div className="list-item-main">
                  <div className="strong">{a.title}</div>
                  <div className="muted">{formatShort(a.date_time)}</div>

                  <div className="meta">
                    {a.doctor_name ? <span>Provider: {a.doctor_name}</span> : null}
                    {a.appointment_type ? <span>Type: {a.appointment_type}</span> : null}
                    <span>Status: {String(a.status ?? "scheduled")}</span>
                    {a.location ? <span>Location: {a.location}</span> : null}
                  </div>

                  {a.notes ? <p className="notes">{a.notes}</p> : null}
                </div>

                <div className="actions-col">
                  <button
                    type="button"
                    onClick={() => navigate(`/appointments/${a.id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(a.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}