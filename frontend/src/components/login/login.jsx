import { useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom"; // Import Link for navigation
// import eyeclose from "/eyeclose.p
// import eyeopen from "/eyeopen.png";
import axios from "axios";
import { getAsset } from "../../config";



const TARGET_TEXT = "Login";
const CYCLES_PER_LETTER = 2;
const SHUFFLE_TIME = 50;
const CHARS = "!@#$%^&*():{};|,.<>/?";
// NOTE: Use your local backend URL for testing, update for production
const API_URL = "https://ren-old.onrender.com/api/students/login"; 

export default function Login({ onClick }) { // Accept onClick prop to close navbar if needed
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [tokenCount, setTokenCount] = useState(null);
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [requirePhone, setRequirePhone] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));

  const normalizeToken = (value) => {
    if (!value) return null;
    return value.startsWith("Bearer ") ? value.slice(7) : value;
  };

  useEffect(() => {
    const stored = normalizeToken(localStorage.getItem("token"));
    if (stored) {
      localStorage.setItem("token", stored);
    }
    setToken(stored);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      if (requirePhone) {
        const digits = String(phone || "").replace(/\D/g, "");
        if (digits.length !== 10) {
          setError("Mobile number must be exactly 10 digits.");
          setIsLoading(false);
          return;
        }
      }
      const response = await axios.post(API_URL, {
        email: email.toLowerCase(),
        password,
        phone: phone || undefined
      });

      if (response.status === 200) {
        const token = response.data.token;
        localStorage.setItem("token", token);
        setToken(token);
        const tokenNo = response.data.student.token
        setSuccessMessage("✅ Login Successful!");
        setTokenCount(tokenNo);
        setRequirePhone(false);
        setTimeout(() => {
          setIsOpen(false);
          navigate("/");
          window.dispatchEvent(new Event("student-auth-changed"));
        }, 1000);
      } else {
        setError(response.data.message || "Invalid email or password.");
      }
    } catch (e) {
      if (e.response?.data?.needsPhone) {
        setRequirePhone(true);
        setError(e.response?.data?.message || "Phone number required.");
      } else {
        setError("Wrong credentials. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    window.dispatchEvent(new Event("student-auth-changed"));
  };

  return (
    <>
      {token ? (
        <button
          onClick={handleLogout}
          className="group relative overflow-hidden rounded-lg border-[1px] left-[1rem] top-1 border-cyan-400 bg-cyan-500 px-4 py-2 font-mono font-medium uppercase text-black transition-colors hover:text-black shadow-[0_0_10px_#00ffff] hover:brightness-110"
        >
          Logout
        </button>
      ) : (
        !isOpen && <EncryptButton onClick={() => setIsOpen(true)} />
      )}

      
        <div
          className="fixed inset-0 flex justify-center items-center z-[1000] bg-cover bg-center bg-no-repeat"
          style={{
           backgroundImage: `url(${getAsset("/login/bg3.webp")})`,
          }}
          onClick={() => setIsOpen(false)}
        >
          {/* Very light overlay for subtle effect */}
          <div className="absolute inset-0 bg-black/10"></div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="relative z-10 m-8 max-w-sm w-96 p-8 flex flex-col gap-y-4 border-4 border-orange-500 shadow-2xl rounded-2xl 
                 text-gray-800 backdrop-blur-lg"
            style={{
              backgroundImage: `url(${getAsset("/login/card.webp")})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundBlendMode: 'overlay',
              backgroundColor: 'rgba(193, 198, 145, 0.6)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 0 40px rgba(255,140,0,0.3), 0 0 60px rgba(255,140,0,0.2), inset 0 0 20px rgba(255,255,255,0.3)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button
            <button
              className="absolute top-4 right-4 text-orange-500 hover:text-orange-600 transition-all duration-300 font-bold text-xl"
              onClick={() => setIsOpen(false)}
            >
              ✖
            </button> */}

            <h2 className="text-4xl font-bold text-center text-white tracking-wider drop-shadow-lg" style={{ fontFamily: 'Helvetica, Arial, sans-serif', WebkitTextStroke: '1px #000000', textShadow: '4px 4px 8px rgba(0,0,0,0.8), 2px 2px 4px rgba(255,140,0,0.4)' }}>
              Student Login
            </h2>
            <p
              className="text-center text-yellow-100 text-sm font-semibold bg-black/40 px-2 py-1 rounded-md"
              style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
            >
              Even if logged in before and registered kindly login once again to add your mobile no.
            </p>

            {successMessage && (
              <p
                className="text-green-200 text-lg font-semibold text-center bg-black/40 px-2 py-1 rounded-md"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
              >
                {successMessage}
              </p>
            )}
            {error && (
              <p
                className="text-red-200 text-lg font-semibold text-center bg-black/40 px-2 py-1 rounded-md"
                style={{ textShadow: "0 1px 2px rgba(0,0,0,0.8)" }}
              >
                {error}
              </p>
            )}

            <form className="space-y-6" onSubmit={handleLogin}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                className="w-full p-3 bg-white border-3 border-orange-500 rounded-lg text-gray-800 placeholder-orange-300 focus:ring-2 focus:ring-orange-400 outline-none transition font-semibold"
                onChange={(e) => setEmail(e.target.value)}
                required
              />

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className="w-full p-3 bg-white border-3 border-orange-500 rounded-lg text-gray-800 placeholder-orange-300 focus:ring-2 focus:ring-orange-400 outline-none transition font-semibold"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {/* <img
                    src={showPassword ? eyeopen : eyeclose}
                    alt="Toggle Password"
                    className="w-6 h-6 opacity-80 hover:opacity-100 transition "
                  /> */}
                </button>
              </div>

              {requirePhone && (
                <input
                  type="tel"
                  name="phone"
                  placeholder="Mobile Number"
                  className="w-full p-3 bg-white border-3 border-orange-500 rounded-lg text-gray-800 placeholder-orange-300 focus:ring-2 focus:ring-orange-400 outline-none transition font-semibold"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  inputMode="numeric"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  required
                />
              )}

              <button
                className="w-full py-3 mt-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-semibold text-lg rounded-xl shadow-lg 
                     hover:from-orange-600 hover:to-orange-700 transition-all duration-300 hover:shadow-orange-500/50 border-2 border-orange-700"
                disabled={isLoading}
              >
                {isLoading ? "Please wait..." : "Submit"}
              </button>

              {/* --- NEW LINKS SECTION --- */}
             <div className="flex flex-col gap-2 mt-4">
  {/* 1. Internal Link - Uses React Router to avoid the preloader */}
  <Link 
    to="/teacher/login" 
    className="text-white font-bold hover:text-yellow-500 transition-colors duration-200"
  >
    Teacher Panel
  </Link>

  {/* 2. External Link - Stays as an <a> tag because it's a different domain (Google Forms) */}
  <a href="https://forms.gle/eVzVYNf2h3v7VUd48" target="_blank" rel="noopener noreferrer">
    <div className="w-full py-2 border-3 border-yellow-500 text-yellow-700 font-semibold text-lg rounded-xl flex items-center justify-center text-center hover:bg-yellow-100 hover:text-yellow-800 transition-all duration-300 backdrop-blur-sm bg-yellow-50">
      NOT A JECRCIAN?
    </div>
  </a>
</div>

            </form>
          </motion.div>
        </div>
      
    </>
  );
}

export const EncryptButton = ({ onClick }) => {
  const intervalRef = useRef(null);
  const [text, setText] = useState(TARGET_TEXT);

  const scramble = () => {
    let pos = 0;
    intervalRef.current = setInterval(() => {
      const scrambled = TARGET_TEXT.split("")
        .map((char, index) =>
          pos / CYCLES_PER_LETTER > index
            ? char
            : CHARS[Math.floor(Math.random() * CHARS.length)]
        )
        .join("");

      setText(scrambled);
      pos++;

      if (pos >= TARGET_TEXT.length * CYCLES_PER_LETTER) stopScramble();
    }, SHUFFLE_TIME);
  };

  const stopScramble = () => {
    clearInterval(intervalRef.current || undefined);
    setText(TARGET_TEXT);
  };

  return (
    <motion.button
      whileHover={{ scale: 1.025 }}
      whileTap={{ scale: 0.975 }}
      onMouseEnter={scramble}
      onMouseLeave={stopScramble}
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg border-[1px] left-[1rem] top-1 border-cyan-400 bg-cyan-500 px-4 py-2 font-mono font-medium uppercase text-black transition-colors hover:text-black shadow-[0_0_10px_#00ffff]"
    >
      <div className="relative z-10 flex items-center gap-2">
        <span>{text}</span>
      </div>
      <motion.span
        initial={{ y: "100%" }}
        animate={{ y: "-100%" }}
        transition={{
          repeat: Infinity,
          repeatType: "mirror",
          duration: 1,
          ease: "linear",
        }}
        className="duration-300 absolute inset-0 z-0 scale-125 bg-gradient-to-t from-cyan-400/0 from-40% via-cyan-500/100 to-cyan-400/0 to-60% opacity-0 transition-opacity group-hover:opacity-100"
      />
    </motion.button>
  );
};
