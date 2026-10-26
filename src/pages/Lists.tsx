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

  async function loadLists() {
    const { data, error } = await supabase
      .from("lists")
      .select("*");

    if (error) {
      console.error(error);
      alert("Не удалось загрузить списки");
      return;
    }

    setLists(data || []);
  }

  async function createList() {
    const newTitle = title.trim();

    if (!newTitle) {
      alert("Введите название списка");
      return;
    }

    const { error } = await supabase
      .from("lists")
      .insert([{ title: newTitle }]);

    if (error) {
      console.error(error);
      alert("Не удалось создать список");
      return;
    }

    setTitle("");
    setShowForm(false);
    await loadLists();
  }

  async function deleteList(listId: string, listTitle: string) {
    const confirmed = window.confirm(
      `Удалить список "${listTitle}" вместе со всеми задачами? Это действие нельзя отменить.`
    );

    if (!confirmed) return;

    // Сначала удаляем задачи внутри списка.
    const { error: itemsError } = await supabase
      .from("list_items")
      .delete()
      .eq("list_id", listId);

    if (itemsError) {
      console.error(itemsError);
      alert("Не удалось удалить задачи списка");
      return;
    }

    // Затем удаляем сам список.
    const { data, error: listError } = await supabase
      .from("lists")
      .delete()
      .eq("id", listId)
      .select("id")
      .maybeSingle();

    if (listError) {
      console.error(listError);
      alert("Не удалось удалить список");
      return;
    }

    if (!data) {
      alert(
        "Список не удалён. Возможно, у текущего пользователя нет прав на удаление."
      );
      return;
    }

    await loadLists();
  }

  return (
    <div>
      <h1>Списки</h1>

      <button onClick={() => setShowForm(!showForm)}>
        Создать список
      </button>

      {showForm && (
        <>
          <input
            type="text"
            placeholder="Название списка"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") createList();
            }}
          />

          <button onClick={createList}>
            Сохранить
          </button>
        </>
      )}

      {lists.map((list) => (
        <div
          key={list.id}
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: "10px",
            marginBottom: "8px",
          }}
        >
          <Link to={`/lists/${list.id}`}>
            {list.title}
          </Link>

          <button
            onClick={() => deleteList(list.id, list.title)}
            style={{ cursor: "pointer" }}
          >
            Удалить
          </button>
        </div>
      ))}
    </div>
  );
}