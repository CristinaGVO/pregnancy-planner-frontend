import { NavLink } from "react-router-dom";
import logo from "../../assets/pregnancy-planner.png";

const Landing = () => {
  return (
    <main className="container">
      <section className="landing-card">
        {/* HERO */}
        <div className="landing-hero landing-hero--center">
          <div className="landing-headings">
            <h1 className="landing-title">Pregnancy Planner</h1>
            <p className="landing-subtitle">
              A simple place to track appointments and your pregnancy timeline.
            </p>
          </div>

          <img className="landing-logo" src={logo} alt="Pregnancy Planner logo" />
        </div>

        {/* FEATURES */}
        <div className="landing-features">
          <div className="landing-feature">
            <div className="landing-featureTitle">Appointments</div>
            <p className="landing-featureText">
              Save visits, providers, location, notes, and status.
            </p>
          </div>

          <div className="landing-feature">
            <div className="landing-featureTitle">Due date</div>
            <p className="landing-featureText">
              See how many weeks are left until you meet your baby.
            </p>
          </div>
        </div>

        {/* SPACER */}
        <div className="landing-spacer" />

        {/* CTA */}
        <div className="landing-cta">
  <p className="landing-ctaText">
    Ready to start?
  </p>

  <div className="landing-ctaButtons">
    <NavLink className="landing-ctaBtn landing-ctaBtn--primary" to="/sign-up">
      Create account
    </NavLink>

    <NavLink className="landing-ctaBtn landing-ctaBtn--secondary" to="/sign-in">
      Sign In
    </NavLink>
  </div>
</div>

      </section>
    </main>
  );
};

export default Landing;
