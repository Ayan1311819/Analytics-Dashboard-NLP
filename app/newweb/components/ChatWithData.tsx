"use client";
import { useState } from "react";
import axios from "axios";

export default function ChatWithData() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post(`${base}/chat-with-data`, { query });
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Ask a question..."
          className="border rounded px-3 py-2 flex-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="bg-sky-600 text-white px-4 py-2 rounded">
          Ask
        </button>
      </form>

      {loading && <p>Loading...</p>}
      {data && (
        <div className="bg-white p-4 rounded shadow">
          <p className="text-sm text-gray-500">SQL: {data.generated_sql}</p>
          <table className="min-w-full mt-4 text-sm">
            <thead>
              <tr>
                {Object.keys(data.results[0] || {}).map((key) => (
                  <th key={key} className="border p-2 text-left">{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.results.map((row: any) => (
                <tr key={row.id}>
                  {Object.values(row).map((val: any, i: number) => (
                    <td key={i} className="border p-2">{String(val)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}