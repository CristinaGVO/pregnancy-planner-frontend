import { Link } from "react-router-dom";

export default function Landing() {
  return (
    <main className="container">
      <section className="card soft">
        <div className="brand" style={{ marginBottom: 12 }}>
          <div className="brand-mark">🤰</div>
          <div>
            <div className="brand-title">Pregnancy Planner</div>
            <p className="muted" style={{ marginBottom: 8}}>
          Track appointments, keep notes, and see your weeks left — all in one place.
        </p>
          </div>
        </div>

       

        <div className="actions-row" style={{ marginTop: 10 }}>
          <Link to="/sign-in">
            <button type="button" className="primary">Sign In</button>
          </Link>
          <Link to="/sign-up">
            <button type="button">Create account</button>
          </Link>
        </div>

        <div className="filters" style={{ marginTop: 16 }}>
          <div className="meta">
            <span>Private</span>
            <span>Simple</span>
            <span>Fast</span>
            <span>For every parent</span>
          </div>
        </div>
      </section>
    </main>
  );
}
