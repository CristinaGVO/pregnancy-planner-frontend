import { useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";

import { UserContext } from "../../contexts/UserContext";
import logo from "../../assets/pregnancy-planner.png";

export default function NavBar() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  function handleSignOut() {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  }

  return (
    <header className="navbar">
      <div className="navbar-inner navbar-inner--left">
        <NavLink to="/" className="brand brand-link">
          <div className="brand-mark brand-mark--nav">
            <img className="brand-logo" src={logo} alt="Pregnancy Planner logo" />
          </div>

          <div>
            <div className="brand-title brand-title--app">Pregnancy Planner</div>
            <div className="brand-subtitle">
              {user ? `@${user.username}` : "Your prenatal care planner"}
            </div>
          </div>
        </NavLink>

        <nav className="nav-links">
          {user ? (
            <>
              <NavLink className="btn" to="/appointments">
                Appointments
              </NavLink>
              <button type="button" className="btn" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <NavLink className="btn" to="/sign-in">
                Sign In
              </NavLink>
              <NavLink className="btn" to="/sign-up">
                Sign Up
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
