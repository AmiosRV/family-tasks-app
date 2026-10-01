import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabase';
 
export default function ListDetails() {
const { id } = useParams();
const [items, setItems] = useState<any[]>([]);
const [listTitle, setListTitle] = useState('');
const [newItem, setNewItem] = useState('');
 
useEffect(() => {
loadList();
loadItems();
}, []);
 
async function loadList() {
const { data } = await supabase
.from('lists')
.select('*')
.eq('id', String(id))
.single();
 
if (data) {
setListTitle(data.title);
}
}
async function loadItems() {
const { data, error } = await supabase
.from('list_items')
.select('*')
.eq('list_id', String(id));;
 
if (error) {
console.error(error);
return;
}
 
setItems(data || []);
}
async function deleteItem(itemId: string) {
const { error } = await supabase
.from('list_items')
.delete()
.eq('id', itemId);
 
if (error) {
alert(JSON.stringify(error));
return;
}
 
loadItems();
}
async function addItem() {
if (!newItem.trim()) return;
 
const { error } = await supabase
.from('list_items')
.insert([
{
list_id: id,
title: newItem,
},
]);
 
if (error) {
alert(JSON.stringify(error));
console.error(error);
return;
}
 
setNewItem('');
loadItems();
}
async function toggleDone(item: any) {
await supabase
.from('list_items')
.update({ done: !item.done })
.eq('id', item.id);
 
loadItems();
}
async function editItem(item: any) {
const newTitle = prompt('Новое название:', item.title);
 
if (!newTitle) return;
 
const { error } = await supabase
.from('list_items')
.update({ title: newTitle })
.eq('id', item.id);
 
if (error) {
alert(JSON.stringify(error));
return;
}
 
loadItems();
}
 
return (
<div>
<h1>Список</h1>
<h2>{listTitle}</h2>
{listTitle === 'Покупки' && (
<>
<input
type="text"
placeholder="Что купить?"
value={newItem}
onChange={(e) => setNewItem(e.target.value)}
/>
 
<button onClick={addItem}>
Добавить покупку
</button>
</>
)}
 
{items.map((item) => (
<div
key={item.id}
style={{
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
gap: '10px',
marginBottom: '8px'
}}
>
<input
type="checkbox"
checked={item.done || false}
onChange={() => toggleDone(item)}
/>
 
<span
style={{
textDecoration: item.done ? 'line-through' : 'none',
minWidth: '200px',
display: 'inline-block'
}}
>
{item.title}
</span>
 
<button
onClick={() => editItem(item)}
style={{
padding: '4px 8px',
cursor: 'pointer'
}}
>
Изменить
</button>
 
<button
onClick={() => deleteItem(item.id)}
style={{
padding: '4px 8px',
cursor: 'pointer'
}}
>
Удалить
</button>
</div>
))}
 
</div>
);
}