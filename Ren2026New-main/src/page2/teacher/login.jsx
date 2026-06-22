import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import "./login.css";

const TeacherLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await axios.post(
        "https://ren-old.onrender.com/api/teacher/login",
        { email, password }
      );

      const token = res.data.token;

      // Store token
      localStorage.setItem("teacherToken", token);

      // Redirect to teacher dashboard
      navigate("/teacher/dashboard");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.msg || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="teacher-login-wrapper">
      <div className="login-container">
        <h2>Teacher Panel Login</h2>

        {errorMessage && <div className="error-popup">{errorMessage}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your Email"
              required
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative', width: '100%' }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                style={{ width: '100%' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {showPassword ? <EyeOff size={20} color="#666" /> : <Eye size={20} color="#666" />}
              </button>
            </div>
          </div>

          <div className="input-group1">
            <button type="submit" className="btn" disabled={loading}>
              {loading ? "Signing In..." : "Login"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherLogin;
