import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";

import { signIn } from "../../services/authService";
import { UserContext } from "../../contexts/UserContext";
import logo from "../../assets/pregnancy-planner.png";

const SignInForm = () => {
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext);

  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    username: "",
    password: "",
  });

  const handleChange = (evt) => {
    setMessage("");
    setFormData({ ...formData, [evt.target.name]: evt.target.value });
  };

  const handleSubmit = async (evt) => {
    evt.preventDefault();
    try {
      const signedInUser = await signIn(formData);
      setUser(signedInUser);
      navigate("/");
    } catch (err) {
      setMessage(err.message);
    }
  };

  return (
    <main className="container">
      <section className="card soft">
        <div className="brand" style={{ marginBottom: 12 }}>
          <div className="brand-mark brand-mark--nav" style={{ width: 46, height: 46 }}>
            <img
              src={logo}
              alt="Pregnancy Planner logo"
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>

          <div>
            <div className="brand-title">Pregnancy Planner</div>
            <div className="brand-subtitle">Welcome back</div>
          </div>
        </div>

        <h2 style={{ marginBottom: 6 }}>Sign In</h2>
        {message ? <div className="alert error">{message}</div> : null}

        <form autoComplete="off" className="form-grid" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="username">Username</label>
            <input
              type="text"
              autoComplete="off"
              id="username"
              value={formData.username}
              name="username"
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <label htmlFor="password">Password</label>
            <input
              type="password"
              autoComplete="off"
              id="password"
              value={formData.password}
              name="password"
              onChange={handleChange}
              required
            />
          </div>

          <div className="actions-row">
            <button className="primary">Sign In</button>
            <button type="button" onClick={() => navigate("/")}>
              Cancel
            </button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default SignInForm;
