// pages/index.js
import { useEffect, useState } from "react";

// 你在 Google Apps Script Deploy 咗嗰條 URL（web app）
// 例子：https://script.google.com/macros/s/XXXXXXXX/exec
const GAS_URL = "https://script.google.com/macros/s/AKfycbxP6Au0rO-gKhlh2hscTf9CCoNLJWC-ZY3zmtX4JlXzQbi5tVA5Uwk6JDn7lYy4d6P2/exec";

export default function Home() {
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [items, setItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState(new Set());
  const [tab, setTab] = useState("all"); // all, toBuy, done

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    const res = await fetch(`${GAS_URL}/stores`);
    const json = await res.json();
    setStores(json.stores || []);
  };

  const fetchItemsByStore = async (store) => {
    if (!store) return;
    setSelectedStore(store);

    const res = await fetch(`${GAS_URL}/items?storeId=${store.storeId}`);
    const json = await res.json();
    setItems(json.items || []);
  };

  const filterItems = (type) => {
    if (type === "all") {
      setTab("all");
      return items;
    } else if (type === "toBuy") {
      setTab("toBuy");
      return items.filter(i => i.isChecked === "false" || !i.isChecked);
    } else if (type === "done") {
      setTab("done");
      return items.filter(i => i.isChecked === "true");
    }
    return items;
  };

  const handleCheck = (itemId, value) => {
    setCheckedItems(new Set(checkedItems.add(String(itemId))));
    setItems(
      items.map(i =>
        i.itemId === itemId
          ? { ...i, isChecked: value ? "true" : "false" }
          : i
      )
    );
  };

  const handleSave = async () => {
    if (checkedItems.size === 0) return;

    const toSave = items
      .filter(i => checkedItems.has(String(i.itemId)))
      .map(i => ({
        itemId: i.itemId,
        isChecked: i.isChecked === "true"
      }));

    const res = await fetch(GAS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: toSave })
    });

    const json = await res.json();
    if (json.success) {
      alert("已保存全部改動！");
      setCheckedItems(new Set()); // 清空已改動
    } else {
      alert("儲存失敗：" + json.error);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>旅行購物清單（福岡 4月19日）</h1>

      <div>
        {stores.map(store => (
          <button
            key={store.storeId}
            onClick={() => fetchItemsByStore(store)}
            style={{ margin: "5px" }}
          >
            {store.storeName}
          </button>
        ))}
      </div>

      {selectedStore && (
        <div>
          <h2>店舖：{selectedStore.storeName}</h2>
          <p>地址：{selectedStore.address}</p>
          <p>喺 4月19日星期日营业時間：{selectedStore.openingHours}</p>
          <p>預計停留時間：{selectedStore.visitTime}</p>

          <div>
            <button onClick={() => filterItems("all")}>全部</button>
            <button onClick={() => filterItems("toBuy")}>未買</button>
            <button onClick={() => filterItems("done")}>已買</button>
            <button onClick={handleSave} style={{ margin: "10px 0" }}>
              一次儲存全部改動
            </button>
          </div>

          <div>
            {filterItems(tab).map(item => (
              <div
                key={item.itemId}
                style={{
                  display: "flex",
                  alignItems: "center",
                  margin: "10px 0"
                }}
              >
                <img
                  src={item.imageUrl}
                  width="60"
                  height="60"
                  style={{ marginRight: 10 }}
                />
                <span style={{ marginRight: 10 }}>{item.itemName}</span>
                <input
                  type="checkbox"
                  checked={item.isChecked === "true"}
                  onChange={e => handleCheck(item.itemId, e.target.checked)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
