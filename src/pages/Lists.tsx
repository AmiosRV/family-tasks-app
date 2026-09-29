import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
 
type List = {
id: string;
title: string;
};
 
export default function Lists() {
const [lists, setLists] = useState<List[]>([]);
const [title, setTitle] = useState("");
 
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
 
<button>
Создать список
</button>

<input
type="text"
placeholder="Название списка"
value={title}
onChange={(e) => setTitle(e.target.value)}
/>

<button onClick={createList}>
Сохранить
</button>

{lists.map((list) => (
<div key={list.id}>
{list.title}
</div>
))}

</div>
);
}