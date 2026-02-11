import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <main className="landing">
      <section className="landing__container">
        <header className="landing__header">
          <h1 className="landing__title">Pregnancy Planner</h1>
          <p className="landing__subtitle">
            A simple way to organize prenatal appointments and notes.
          </p>
        </header>

        <div className="landing__actions">
          <Link className="btn btn--primary" to="/sign-up">
            Create account
          </Link>
          <Link className="btn btn--secondary" to="/sign-in">
            Sign in
          </Link>
        </div>

        <ul className="landing__list">
          <li>Track appointments (doctor, type, status, notes)</li>
          <li>See your next scheduled appointment</li>
          <li>Filter appointments: upcoming / past / all</li>
        </ul>

        <p className="landing__footnote">
          Already have an account? <Link to="/sign-in">Sign in</Link>
        </p>
      </section>
    </main>
  );
};

export default Landing;

