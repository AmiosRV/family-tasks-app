import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
 
type List = {
id: string;
title: string;
};
 
export default function Lists() {
const [lists, setLists] = useState<List[]>([]);
 
useEffect(() => {
loadLists();
}, []);
 
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
 
{lists.map((list) => (
<div key={list.id}>
{list.title}
</div>
))}
</div>
);
}