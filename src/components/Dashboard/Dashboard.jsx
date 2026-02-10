import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../contexts/usercontext";
import { getAppointments, createAppointment } from "../services/appointmentsService";

export default function Dashboard() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [message, setMessage] = useState("");

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

    async function load() {
      const token = localStorage.getItem("token");
      const data = await getAppointments(token);
      setAppointments(Array.isArray(data) ? data : []);
    }

    load();
  }, [user, navigate]);

  const handleChange = (e) => {
    setMessage("");
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const created = await createAppointment(token, formData);

      if (created.error) throw new Error(created.error);

      setAppointments((prev) => [...prev, created]);
      setFormData({ title: "", date_time: "", location: "", notes: "" });
      setMessage("Appointment created ✅");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "30px auto" }}>
      <h2>Appointments</h2>

      {message && <p>{message}</p>}

      <form onSubmit={handleSubmit}>
        <h3>Create Appointment</h3>

        <div>
          <label>Title</label><br />
          <input name="title" value={formData.title} onChange={handleChange} required />
        </div>

        <div>
          <label>Date Time (YYYY-MM-DD HH:MM:SS)</label><br />
          <input
            name="date_time"
            value={formData.date_time}
            onChange={handleChange}
            placeholder="2026-02-15 10:30:00"
            required
          />
        </div>

        <div>
          <label>Location</label><br />
          <input name="location" value={formData.location} onChange={handleChange} />
        </div>

        <div>
          <label>Notes</label><br />
          <textarea name="notes" value={formData.notes} onChange={handleChange} />
        </div>

        <button type="submit">Create</button>
      </form>

      <hr />

      {appointments.length === 0 ? (
        <p>No appointments yet.</p>
      ) : (
        appointments.map((a) => (
          <div key={a.id} style={{ border: "1px solid #ddd", padding: 12, marginBottom: 10 }}>
            <div><b>{a.title}</b></div>
            <div>{String(a.date_time)}</div>
          </div>
        ))
      )}
    </div>
  );
}
