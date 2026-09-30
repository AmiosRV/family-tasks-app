import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../services/supabase";
 
type List = {
id: string;
title: string;
};
 
export default function Lists() {
const [lists, setLists] = useState<List[]>([]);
const [title, setTitle] = useState("");
const [showForm, setShowForm] = useState(false);
 
useEffect(() => {
loadLists();
}, []);

async function createList() {
const { error } = await supabase
.from("lists")
.insert([
{
title: title,
},
]);
 
if (error) {
console.error(error);
return;
}
 
setTitle("");
loadLists();
}
 
async function loadLists() {
const { data, error } = await supabase
.from("lists")
.select("*");
 
if (error) {
console.error(error);
return;
}
 
setLists(data || []);
}
 
return (
<div>
<h1>Списки</h1>
 
<button onClick={() => setShowForm(!showForm)}>
Добавить покупку
</button>

{showForm && (
<>
<input
type="text"
placeholder="Что купить?"
value={title}
onChange={(e) => setTitle(e.target.value)}
/>
 
<button onClick={createList}>
Сохранить
</button>
</>
)}
Показать больше строк

{lists.map((list) => (
<div key={list.id}>
<Link to={`/lists/${list.id}`}>
{list.title}
</Link>
</div>
))}

</div>
);
}