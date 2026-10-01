import { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
 
export default function Reminders() {
const [title, setTitle] = useState('');
const [dueDate, setDueDate] = useState('');
const [reminders, setReminders] = useState<any[]>([]);
 
useEffect(() => {
loadReminders();
}, []);
 
async function loadReminders() {
const { data, error } = await supabase
.from('reminders')
.select('*')
.order('due_date', { ascending: true });
 
if (!error) {
setReminders(data || []);
}
}
 
async function addReminder() {
if (!title.trim()) return;
 
const { data, error } = await supabase
.from('reminders')
.insert([
{
title,
due_date: dueDate || null,
},
])
.select();
 
console.log('DATA:', data);
console.log('ERROR:', error);
 
if (!error) {
setTitle('');
setDueDate('');
loadReminders();
}
}
``
 
return (
<div>
<h1>Напоминания</h1>
 
<input
value={title}
onChange={(e) => setTitle(e.target.value)}
placeholder="Текст напоминания"
/>
 
<input
type="date"
value={dueDate}
onChange={(e) => setDueDate(e.target.value)}
/>
 
<button onClick={addReminder}>
Добавить
</button>
 
<ul>
{reminders.map((reminder) => (
<li key={reminder.id}>
{reminder.title}
{reminder.due_date && ` (${reminder.due_date})`}
</li>
))}
</ul>
</div>
);
}