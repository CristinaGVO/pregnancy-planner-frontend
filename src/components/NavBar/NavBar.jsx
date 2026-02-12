import { useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UserContext } from "../../contexts/UserContext";

export default function NavBar() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleSignOut = () => {
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">
          <div className="brand-mark">🤰</div>
          <div>
            <div className="brand-title">Pregnancy Planner</div>
            <div className="brand-subtitle">A calm space for your prenatal journey</div>
          </div>
        </Link>

        <nav className="nav-links">
          {!user ? (
            <>
              <Link className="chip" to="/sign-in">Sign In</Link>
              <Link className="chip active" to="/sign-up">Sign Up</Link>
            </>
          ) : (
            <>
              <span className="badge mint">{user.username}</span>
              <button type="button" onClick={handleSignOut}>
                Sign Out
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

