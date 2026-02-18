import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { UserContext } from "../../contexts/UserContext";
import { getAppointments, deleteAppointment } from "../../services/appointmentsService";

function parseDateTime(dt) {
  if (!dt) return null;

  const direct = new Date(dt);
  if (!Number.isNaN(direct.getTime())) return direct;

  const s = String(dt).replace(" ", "T");
  const fallback = new Date(s);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function formatDate(dt) {
  const d = parseDateTime(dt);
  if (!d) return "";
  return d.toLocaleDateString();
}

function formatTime(dt) {
  const d = parseDateTime(dt);
  if (!d) return "";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AppointmentsIndex() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState("upcoming"); // all | upcoming | past

  async function load() {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const data = await getAppointments(token);
      setAppointments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user) {
      navigate("/sign-in");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, navigate]);

  const sorted = useMemo(() => {
    const copy = [...appointments];
    copy.sort((a, b) => {
      const da = parseDateTime(a.date_time)?.getTime() ?? 0;
      const db = parseDateTime(b.date_time)?.getTime() ?? 0;
      return da - db;
    });
    return copy;
  }, [appointments]);

  const filtered = useMemo(() => {
    const now = new Date();
    if (filter === "all") return sorted;

    if (filter === "upcoming") {
      return sorted.filter((a) => {
        const d = parseDateTime(a.date_time);
        return d && d >= now;
      });
    }

    // past
    return sorted.filter((a) => {
      const d = parseDateTime(a.date_time);
      return d && d < now;
    });
  }, [sorted, filter]);

  async function handleDelete(id) {
    const ok = window.confirm("Delete this appointment?");
    if (!ok) return;

    const token = localStorage.getItem("token");
    await deleteAppointment(token, id);
    setAppointments((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <main className="container">
      <div className="hero">
        <div className="hero-row">
          <div>
            <h2 style={{ margin: 0 }}>Appointments</h2>
            <p className="muted" style={{ margin: "6px 0 0" }}>
              Filtra y organiza tus citas.
            </p>
          </div>

          <div className="actions-row">
            <button className="btn" type="button" onClick={() => navigate("/appointments/new")}>
              + New appointment
            </button>
            <button className="btn" type="button" onClick={() => navigate("/")}>
              Back to dashboard
            </button>
          </div>
        </div>
      </div>

      {/* TOOLBAR (filtros arriba, bien ubicados) */}
      <div className="toolbar">
        <div className="toolbar-left">
          <button className="btn" type="button" onClick={() => setFilter("all")}>
            All
          </button>
          <button className="btn" type="button" onClick={() => setFilter("upcoming")}>
            Upcoming
          </button>
          <button className="btn" type="button" onClick={() => setFilter("past")}>
            Past
          </button>
        </div>

        <div className="toolbar-right">
          <span className="badge sky">{filtered.length} items</span>
        </div>
      </div>

      {/* LIST */}
      <section className="card soft tint-mint">
        {loading ? (
          <p className="muted">Loading...</p>
        ) : filtered.length === 0 ? (
          <p className="muted">No appointments for this filter.</p>
        ) : (
          <div className="list">
            {filtered.map((a) => (
              <div key={a.id} className="list-item">
                <div className="list-item-main">
                  <div className="strong" style={{ fontSize: 18 }}>
                    {a.title}
                  </div>

                  <div className="meta">
                    <span>Date: {formatDate(a.date_time)}</span>
                    <span>Time: {formatTime(a.date_time)}</span>

                    {(a.provider_name || a.doctor_name) ? (
                      <span>Provider: {a.provider_name || a.doctor_name}</span>
                    ) : null}

                    {a.appointment_type ? <span>Type: {a.appointment_type}</span> : null}
                    {a.status ? <span>Status: {String(a.status)}</span> : null}
                    {a.location ? <span>Location: {a.location}</span> : null}
                  </div>

                  {a.notes ? <div className="notes">{a.notes}</div> : null}
                </div>

                {/* Acciones más separadas */}
                <div className="actions-col" style={{ minWidth: 170 }}>
                  <button
                    className="btn"
                    type="button"
                    onClick={() => navigate(`/appointments/${a.id}/edit`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn"
                    type="button"
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
    </main>
  );
}
