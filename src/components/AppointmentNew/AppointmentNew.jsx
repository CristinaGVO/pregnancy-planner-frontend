import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";

import { UserContext } from "../../contexts/UserContext";
import { createAppointment } from "../../services/appointmentsService";

import logo from "../../assets/pregnancy-planner.png";

const STATUS_OPTIONS = ["scheduled", "completed", "canceled"];

function isErrorPayload(x) {
  return x && typeof x === "object" && (x.error || x.err);
}

export default function AppointmentNew() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [alert, setAlert] = useState({ kind: "", text: "" });
  const showAlert = (kind, text) => setAlert({ kind, text });

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

  if (!user) {
    navigate("/sign-in");
    return null;
  }

  const handleChange = (e) => {
    setAlert({ kind: "", text: "" });
    setFormData((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAlert({ kind: "", text: "" });

    try {
      if (!formData.date || !formData.time) {
        throw new Error("Please select date and time");
      }

      const token = localStorage.getItem("token");

      const payload = {
        title: formData.title,
        date_time: `${formData.date} ${formData.time}:00`,
        doctor_name: formData.provider_name || null,
        appointment_type: formData.appointment_type || null,
        status: formData.status || "scheduled",
        location: formData.location || null,
        notes: formData.notes || null,
      };

      const created = await createAppointment(token, payload);
      if (isErrorPayload(created)) throw new Error(created.error || created.err);

      showAlert("success", "Appointment created ✅");
      setTimeout(() => navigate("/appointments"), 500);
    } catch (err) {
      showAlert("error", err?.message || "Error creating appointment");
    }
  };

  return (
    <main className="container">
      {/* ✅ Compact hero + centered brand, NO "New" badge */}
      <div className="hero hero--compact">
        <div className="hero-row">
          <div className="hero-left">
            <div className="brand-center" style={{ marginBottom: 10 }}>
              <img className="brand-logo" src={logo} alt="Pregnancy Planner logo" />
              <div className="brand-title-sm">Pregnancy Planner</div>
              <div className="brand-subtitle-center">Create appointment</div>
            </div>

            <h2 className="hero-title">New appointment</h2>
            <p className="hero-sub">Add your next visit, class, or reminder.</p>
          </div>
        </div>
      </div>

      {alert.text ? <div className={`alert ${alert.kind}`}>{alert.text}</div> : null}

      {/* ✅ Optional: compact card */}
      <section className="card soft card--compact">
        <div className="section-header">
          <h3>Appointment details</h3>
          <span className="badge peach">Form</span>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
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
              <input type="date" name="date" value={formData.date} onChange={handleChange} required />
            </div>
            <div>
              <label>Time</label>
              <input type="time" name="time" value={formData.time} onChange={handleChange} required />
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
            <button type="button" onClick={() => navigate("/appointments")}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}