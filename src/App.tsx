import { Link, Routes, Route } from "react-router-dom";
 
import Home from "./pages/Home";
import Lists from "./pages/Lists";
import Reminders from "./pages/Reminders";
import Settings from "./pages/Settings";
 
function App() {
return (
<div>
<nav>
<Link to="/">Главная</Link> |{" "}
<Link to="/lists">Списки</Link> |{" "}
<Link to="/reminders">Напоминания</Link> |{" "}
<Link to="/settings">Настройки</Link>
</nav>
 
<hr />
 
<Routes>
<Route path="/" element={<Home />} />
<Route path="/lists" element={<Lists />} />
<Route path="/reminders" element={<Reminders />} />
<Route path="/settings" element={<Settings />} />
</Routes>
</div>
);
}
 
export default App;