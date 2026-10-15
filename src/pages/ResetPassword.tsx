import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [passwordRepeat, setPasswordRepeat] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (!password || !passwordRepeat) {
      alert("Введите новый пароль два раза");
      return;
    }

    if (password !== passwordRepeat) {
      alert("Пароли не совпадают");
      return;
    }

    if (password.length < 6) {
      alert("Пароль должен содержать минимум 6 символов");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setLoading(false);

    if (error) {
      alert("Ошибка: " + error.message);
      return;
    }

    alert("Пароль успешно изменён");

    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <div>
      <h1>Новый пароль</h1>

      <input
        type="password"
        placeholder="Новый пароль"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <br />

      <input
        type="password"
        placeholder="Повторите пароль"
        value={passwordRepeat}
        onChange={(e) => setPasswordRepeat(e.target.value)}
      />

      <br />

      <button onClick={handleResetPassword} disabled={loading}>
        {loading ? "Сохраняем..." : "Сохранить новый пароль"}
      </button>
    </div>
  );
}

export default ResetPassword;