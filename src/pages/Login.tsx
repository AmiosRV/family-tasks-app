
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Введите Email и пароль");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    navigate("/");
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Сначала введите Email");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo:
        "https://upgraded-space-goggles-gxrxqw4vjqvp2wgwx-5173.app.github.dev/reset-password",
    });

    setLoading(false);

    if (error) {
      alert("Ошибка: " + error.message);
      return;
    }

    alert("Письмо для восстановления пароля отправлено");
  };

  return (
    <div>
      <h1>Вход</h1>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <br />

      <input
        type={showPassword ? "text" : "password"}
        placeholder="Пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      <button
        type="button"
        onClick={() => setShowPassword((prev) => !prev)}
        disabled={loading}
      >
        {showPassword ? "Скрыть пароль" : "Показать пароль"}
      </button>

      <br />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Подождите..." : "Войти"}
      </button>

      <br />
      <br />

      <button onClick={handleForgotPassword} disabled={loading}>
        Забыли пароль?
      </button>
    </div>
  );
}

export default Login;
