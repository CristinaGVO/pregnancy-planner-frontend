import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { UserContext } from "../../contexts/UserContext";
import {
    getAppointments,
    deleteAppointment,
} from "../../services/appointmentsService";

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

function isErrorPayload(x) {
    return x && typeof x === "object" && (x.error || x.err);
}

export default function AppointmentsIndex() {
    const { user } = useContext(UserContext);
    const navigate = useNavigate();

    const [appointments, setAppointments] = useState([]);
    const [filter, setFilter] = useState("upcoming"); // all | upcoming | past
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ kind: "", text: "" });

    const showAlert = (kind, text) => setAlert({ kind, text });

    async function loadAppointments() {
        try {
            setLoading(true);
            setAlert({ kind: "", text: "" });

            const token = localStorage.getItem("token");
            const data = await getAppointments(token);

            if (isErrorPayload(data)) throw new Error(data.error || data.err);
            setAppointments(Array.isArray(data) ? data : []);
        } catch (err) {
            showAlert("error", err?.message || "Error loading appointments");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (!user) {
            navigate("/sign-in");
            return;
        }
        loadAppointments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

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

        return sorted.filter((a) => {
            const d = parseDateTime(a.date_time);
            if (!d) return false;
            return filter === "upcoming" ? d >= now : d < now;
        });
    }, [sorted, filter]);

    const handleDelete = async (id) => {
        const ok = window.confirm("Delete this appointment?");
        if (!ok) return;

        try {
            const token = localStorage.getItem("token");
            const res = await deleteAppointment(token, id);

            if (isErrorPayload(res)) throw new Error(res.error || res.err);

            showAlert("success", "Appointment deleted ✅");
            await loadAppointments();
        } catch (err) {
            showAlert("error", err?.message || "Error deleting appointment");
        }
    };

    return (
        <main className="container">
            <div className="hero">
                <div className="hero-row">
                    <div>
                        <div className="brand" style={{ marginBottom: 10 }}>
                            <div className="brand-mark">🤰</div>
                            <div>
                                <div className="brand-title">
                                    Pregnancy Planner
                                </div>
                                <div className="brand-subtitle">
                                    All appointments
                                </div>
                            </div>
                        </div>

                        <h2 className="hero-title">Appointments</h2>
                        <p className="hero-sub">
                            View, edit, and manage your schedule.
                        </p>
                    </div>

                    <span className="badge sky">{filtered.length} shown</span>
                </div>
            </div>

            {alert.text ? (
                <div className={`alert ${alert.kind}`}>{alert.text}</div>
            ) : null}

            <section className="card soft">
                <div className="section-header">
                    <h3>Your Appointments</h3>
                    <span className="badge peach">Manage</span>
                </div>

                <div className="actions-row" style={{ marginBottom: 12 }}>
                    <button
                        className="primary"
                        type="button"
                        onClick={() => navigate("/appointments/new")}
                    >
                        + New appointment
                    </button>
                    <button type="button" onClick={() => navigate("/")}>
                        Back to Dashboard
                    </button>

                    <div className="chips" style={{ marginLeft: "auto" }}>
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

                {loading ? (
                    <p className="muted">Loading...</p>
                ) : filtered.length === 0 ? (
                    <p className="muted">No appointments for this filter.</p>
                ) : (
                    <div className="list">
                        {filtered.map((a) => {
                            const statusKey = String(a.status ?? "scheduled")
                                .toLowerCase()
                                .trim();
                            return (
                                <div key={a.id} className="list-item">
                                    <div className="list-item-main">
                                        <div className="strong">{a.title}</div>
                                        <div className="muted">
                                            {formatShort(a.date_time)}
                                        </div>

                                        <div className="meta">
                                            {a.doctor_name ? (
                                                <span>
                                                    Provider: {a.doctor_name}
                                                </span>
                                            ) : null}
                                            {a.appointment_type ? (
                                                <span>
                                                    Type: {a.appointment_type}
                                                </span>
                                            ) : null}
                                            <span
                                                className={`pill ${statusKey}`}
                                            >
                                                {statusKey}
                                            </span>
                                            {a.location ? (
                                                <span>
                                                    Location: {a.location}
                                                </span>
                                            ) : null}
                                        </div>

                                        {a.notes ? (
                                            <p className="notes">{a.notes}</p>
                                        ) : null}
                                    </div>

                                    <div className="actions-col">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                navigate(
                                                    `/appointments/${a.id}/edit`,
                                                )
                                            }
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
                            );
                        })}
                    </div>
                )}
            </section>
        </main>
    );
}
