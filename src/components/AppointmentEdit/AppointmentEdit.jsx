import { useEffect, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { UserContext } from "../../contexts/UserContext";
import {
  getAppointmentById,
  updateAppointment,
} from "../../services/appointmentsService";

export default function AppointmentEdit() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();
  const { id } = useParams();

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    title: "",
    date_time: "",
    location: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
      return;
    }

    async function loadAppointment() {
      try {
        const token = localStorage.getItem("token");
        const data = await getAppointmentById(token, id);

        if (data.error) throw new Error(data.error);

        // Prefill ✅
        setFormData({
          title: data.title || "",
          date_time: formatForInput(data.date_time),
          location: data.location || "",
          notes: data.notes || "",
        });

        setLoading(false);
      } catch (err) {
        setMessage(err.message);
        setLoading(false);
      }
    }

    loadAppointment();
  }, [user, navigate, id]);

  const handleChange = (e) => {
    setMessage("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");

      // Si estás usando input type="datetime-local", conviértelo a "YYYY-MM-DD HH:MM:SS"
      const payload = {
        ...formData,
        date_time: formData.date_time.replace("T", " ") + ":00",
      };

      const updated = await updateAppointment(token, id, payload);

      if (updated.error) throw new Error(updated.error);

      setMessage("Appointment updated ✅");

      // vuelve al dashboard
      navigate("/");
    } catch (err) {
      setMessage(err.message);
    }
  };

  if (loading) return <p style={{ maxWidth: 700, margin: "30px auto" }}>Loading...</p>;

  return (
    <div style={{ maxWidth: 700, margin: "30px auto" }}>
      <h2>Edit Appointment</h2>
      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 10 }}>
          <label>Title</label>
          <br />
          <input
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Date Time</label>
          <br />
          <input
            type="datetime-local"
            name="date_time"
            value={formData.date_time}
            onChange={handleChange}
            required
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Location</label>
          <br />
          <input
            name="location"
            value={formData.location}
            onChange={handleChange}
          />
        </div>

        <div style={{ marginBottom: 10 }}>
          <label>Notes</label>
          <br />
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
          />
        </div>

        <button type="submit">Save</button>
        <button
          type="button"
          style={{ marginLeft: 10 }}
          onClick={() => navigate("/")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}

// Convierte "2026-02-15T18:30:00" o "2026-02-15 18:30:00" a "YYYY-MM-DDTHH:MM"
function formatForInput(dateTime) {
  if (!dateTime) return "";
  const str = String(dateTime);
  // si viene con espacio, cambia a T
  const cleaned = str.includes(" ") ? str.replace(" ", "T") : str;
  // corta segundos si existen
  return cleaned.slice(0, 16);
}
