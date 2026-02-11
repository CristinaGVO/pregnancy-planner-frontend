import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { UserContext } from "../../contexts/UserContext";
import {
  getAppointmentById,
  updateAppointment,
} from "../../services/appointmentsService";

const STATUS_OPTIONS = ["scheduled", "completed", "canceled"];

function splitDateTime(dt) {
  if (!dt) return { date: "", time: "" };
  const s = String(dt).replace(" ", "T");
  return { date: s.slice(0, 10), time: s.slice(11, 16) };
}

export default function AppointmentEdit() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

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

  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
      return;
    }

    async function load() {
      try {
        const token = localStorage.getItem("token");
        const data = await getAppointmentById(token, id);

        if (data.error) throw new Error(data.error);

        const { date, time } = splitDateTime(data.date_time);

        setFormData({
          title: data.title || "",
          date,
          time,
          doctor_name: data.doctor_name || "",
          appointment_type: data.appointment_type || "",
          status: data.status || "scheduled",
          location: data.location || "",
          notes: data.notes || "",
        });

        setLoading(false);
      } catch (err) {
        setMessage(err.message);
        setLoading(false);
      }
    }

    load();
  }, [user, navigate, id]);

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

      const updated = await updateAppointment(token, id, payload);
      if (updated.error) throw new Error(updated.error);

      navigate("/");
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) {
    return <p style={{ maxWidth: 820, margin: "30px auto" }}>Loading...</p>;
  }

  return (
    <div style={{ maxWidth: 820, margin: "30px auto", padding: 16 }}>
      <h2>Edit Appointment</h2>
      {message && <p>{message}</p>}

      <form
        onSubmit={handleSubmit}
        style={{
          border: "1px solid #ddd",
          borderRadius: 10,
          padding: 16,
          display: "grid",
          gap: 10,
        }}
      >
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label>Doctor Name</label>
            <br />
            <input
              name="doctor_name"
              value={formData.doctor_name}
              onChange={handleChange}
              style={{ width: "100%" }}
            />
          </div>

          {/* ✅ Appointment Type ahora es input */}
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
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

        <div style={{ display: "flex", gap: 10 }}>
          <button type="submit">Save</button>
          <button type="button" onClick={() => navigate("/")}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

