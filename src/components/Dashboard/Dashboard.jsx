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
  const s = String(dt).replace(" ", "T"); // "YYYY-MM-DD HH:MM:SS" -> "YYYY-MM-DDTHH:MM:SS"
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatShort(dt) {
  const d = parseDateTime(dt);
  if (!d) return String(dt);
  return d.toLocaleString();
}

export default function Dashboard() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState("upcoming"); // "all" | "upcoming" | "past"
  const [loading, setLoading] = useState(true);

  // Pregnancy profile
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    due_date: "",
    baby_nickname: "",
  });

  // Create appointment form
  const [formData, setFormData] = useState({
    title: "",
    date: "",
    time: "",
    doctor_name: "",
    appointment_type: "",
    status: "scheduled",
    location: "",
    notes: "",
  });

  async function refreshData() {
    try {
      const token = localStorage.getItem("token");

      // load appointments
      const apptData = await getAppointments(token);
      setAppointments(Array.isArray(apptData) ? apptData : []);

      // load pregnancy profile
      const prof = await getProfile(token);
      setProfile(prof);

      if (prof) {
        setProfileForm({
          due_date: prof.due_date || "",
          baby_nickname: prof.baby_nickname || "",
        });
      }
    } catch (error) {
      setMessage(error?.message || "Error loading data");
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

  const weeksLeft = useMemo(() => {
    if (!profile?.due_date) return null;

    const today = new Date();
    const due = new Date(profile.due_date + "T00:00:00");

    const diffMs = due - today;
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const w = Math.max(0, Math.ceil(diffDays / 7));

    return w;
  }, [profile]);

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

  // Next appointment (future + scheduled)
  const nextAppointment = useMemo(() => {
    const now = new Date();
    return sortedAppointments.find((a) => {
      const d = parseDateTime(a.date_time);
      if (!d) return false;
      return d >= now && (a.status ?? "scheduled") === "scheduled";
    });
  }, [sortedAppointments]);

  const handleChange = (e) => {
    setMessage("");
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      if (!formData.date || !formData.time) {
        throw new Error("Please select date and time");
      }

      const token = localStorage.getItem("token");

      const payload = {
        title: formData.title,
        date_time: `${formData.date} ${formData.time}:00`,
        doctor_name: formData.doctor_name || null,
        appointment_type: formData.appointment_type || null,
        status: formData.status || "scheduled",
        location: formData.location || null,
        notes: formData.notes || null,
      };

      const created = await createAppointment(token, payload);

      if (created?.error) {
        throw new Error(created.error);
      }

      await refreshData();

      setFormData({
        title: "",
        date: "",
        time: "",
        doctor_name: "",
        appointment_type: "",
        status: "scheduled",
        location: "",
        notes: "",
      });

      setMessage("Appointment created ✅");
    } catch (error) {
      setMessage(error?.message || "Something went wrong");
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm("Delete this appointment?");
    if (!ok) return;

    try {
      const token = localStorage.getItem("token");
      const deleted = await deleteAppointment(token, id);

      if (deleted?.error) {
        throw new Error(deleted.error);
      }

      await refreshData();
      setMessage("Appointment deleted ✅");
    } catch (error) {
      setMessage(error?.message || "Something went wrong");
    }
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const token = localStorage.getItem("token");

      if (!profileForm.due_date) {
        throw new Error("Please select a due date");
      }

      // If profile exists -> PUT, else -> POST
      const result = profile
        ? await updateProfile(token, profileForm)
        : await createProfile(token, profileForm);

      if (result?.error) throw new Error(result.error);

      setProfile(result);
      setMessage(profile ? "Profile updated ✅" : "Profile saved ✅");
    } catch (error) {
      setMessage(error?.message || "Error saving profile");
    }
  };

  return (
    <div style={{ maxWidth: 820, margin: "30px auto", padding: 16 }}>
      <h2>Dashboard</h2>

      {message && <p>{message}</p>}

      {/* Pregnancy Profile */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Pregnancy</h3>

        {loading ? (
          <p>Loading...</p>
        ) : profile ? (
          <>
            <p style={{ margin: "6px 0" }}>
              <b>{weeksLeft}</b> weeks left until your due date ({profile.due_date})
              {profile.baby_nickname ? ` • Nickname: ${profile.baby_nickname}` : ""}
            </p>

            <form
              onSubmit={handleProfileSubmit}
              style={{ display: "grid", gap: 10, marginTop: 10 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <label>Due Date</label>
                  <br />
                  <input
                    type="date"
                    value={profileForm.due_date}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, due_date: e.target.value }))
                    }
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label>Baby Nickname (optional)</label>
                  <br />
                  <input
                    value={profileForm.baby_nickname}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        baby_nickname: e.target.value,
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <button type="submit">Save Profile</button>
              </div>
            </form>
          </>
        ) : (
          <>
            <p style={{ margin: "6px 0" }}>
              Add your due date to see how many weeks are left.
            </p>

            <form
              onSubmit={handleProfileSubmit}
              style={{ display: "grid", gap: 10, marginTop: 10 }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                }}
              >
                <div>
                  <label>Due Date</label>
                  <br />
                  <input
                    type="date"
                    value={profileForm.due_date}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, due_date: e.target.value }))
                    }
                    required
                    style={{ width: "100%" }}
                  />
                </div>

                <div>
                  <label>Baby Nickname (optional)</label>
                  <br />
                  <input
                    value={profileForm.baby_nickname}
                    onChange={(e) =>
                      setProfileForm((p) => ({
                        ...p,
                        baby_nickname: e.target.value,
                      }))
                    }
                    style={{ width: "100%" }}
                  />
                </div>
              </div>

              <div>
                <button type="submit">Save</button>
              </div>
            </form>
          </>
        )}
      </div>

      {/* Next Appointment */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Next Appointment</h3>

        {loading ? (
          <p>Loading...</p>
        ) : nextAppointment ? (
          <>
            <div style={{ fontWeight: 700 }}>{nextAppointment.title}</div>
            <div>{formatShort(nextAppointment.date_time)}</div>
            {nextAppointment.doctor_name && (
              <div>Provider: {nextAppointment.doctor_name}</div>
            )}
            {nextAppointment.appointment_type && (
              <div>Type: {nextAppointment.appointment_type}</div>
            )}
            <div>Status: {nextAppointment.status ?? "scheduled"}</div>

            <div style={{ marginTop: 10 }}>
              <button
                type="button"
                onClick={() =>
                  navigate(`/appointments/${nextAppointment.id}/edit`)
                }
              >
                Edit
              </button>
            </div>
          </>
        ) : (
          <p>No upcoming scheduled appointments.</p>
        )}
      </div>

      {/* Create Appointment */}
      <div
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 16,
          marginBottom: 16,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Create Appointment</h3>

        <form onSubmit={handleSubmit} style={{ display: "grid", gap: 10 }}>
          <div>
            <label>Title</label>
            <br />
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              style={{ width: "100%" }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <label>Date</label>
              <br />
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label>Time</label>
              <br />
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <label>Provider Name</label>
              <br />
              <input
                name="doctor_name"
                value={formData.doctor_name}
                onChange={handleChange}
                style={{ width: "100%" }}
              />
            </div>

            <div>
              <label>Appointment Type</label>
              <br />
              <input
                name="appointment_type"
                value={formData.appointment_type}
                onChange={handleChange}
                placeholder="e.g. Ultrasound, OB Visit, Lab, Class..."
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            <div>
              <label>Status</label>
              <br />
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                style={{ width: "100%" }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Location</label>
              <br />
              <input
                name="location"
                value={formData.location}
                onChange={handleChange}
                style={{ width: "100%" }}
              />
            </div>
          </div>

          <div>
            <label>Notes</label>
            <br />
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <button type="submit">Create</button>
          </div>
        </form>
      </div>

      {/* Filter */}
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          marginBottom: 10,
        }}
      >
        <strong>Filter:</strong>
        <button type="button" onClick={() => setFilter("all")}>
          All
        </button>
        <button type="button" onClick={() => setFilter("upcoming")}>
          Upcoming
        </button>
        <button type="button" onClick={() => setFilter("past")}>
          Past
        </button>
      </div>

      {/* List */}
      <h3>Appointments</h3>

      {loading ? (
        <p>Loading...</p>
      ) : filteredAppointments.length === 0 ? (
        <p>No appointments for this filter.</p>
      ) : (
        filteredAppointments.map((a) => (
          <div
            key={a.id}
            style={{
              border: "1px solid #ddd",
              padding: 12,
              marginBottom: 10,
              borderRadius: 10,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 700 }}>{a.title}</div>
                <div>{formatShort(a.date_time)}</div>
                {a.doctor_name && <div>Provider: {a.doctor_name}</div>}
                {a.appointment_type && <div>Type: {a.appointment_type}</div>}
                <div>Status: {a.status ?? "scheduled"}</div>
                {a.location && <div>Location: {a.location}</div>}
                {a.notes && <div>Notes: {a.notes}</div>}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <button
                  type="button"
                  onClick={() => navigate(`/appointments/${a.id}/edit`)}
                >
                  Edit
                </button>
                <button type="button" onClick={() => handleDelete(a.id)}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}


