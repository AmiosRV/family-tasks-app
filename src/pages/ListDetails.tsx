import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
 
export default function ListDetails() {
const { id } = useParams();
const [items, setItems] = useState<any[]>([]);
 
useEffect(() => {
loadItems();
}, []);
 
async function loadItems() {
const { data, error } = await supabase
.from('list_items')
.select('*')
.eq('list_id', String(id));
 
if (error) {
console.error(error);
return;
}
 
setItems(data || []);
}
 
return (
<div>
<h1>Список</h1>
<p>ID: {id}</p>
 
{items.map((item) => (
<div key={item.id}>
{item.title}
</div>
))}
</div>
);
}
