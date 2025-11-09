"use client";
import { useState } from "react";
import axios from "axios";
import { Send, Loader2 } from "lucide-react";

export default function ChatPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const base = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setData(null);

    try {
      const res = await axios.post(`${base}/chat-with-data`, { query });
      setData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to execute query");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto overflow-x-hidden">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Chat with Data</h2>
          <p className="text-gray-600">
            Ask questions about your invoices in natural language
          </p>
        </div>

        {/* Query Form */}
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g., Show me all invoices from Vendor X"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Execute
                </>
              )}
            </button>
          </div>
        </form>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Results Display */}
        {data && (
          <div className="space-y-4">
            {/* SQL Query Display */}
            <div className="p-4 bg-gray-50 rounded-lg overflow-x-auto">
              <p className="text-xs font-semibold text-gray-500 mb-2">
                Generated SQL:
              </p>
              <code className="text-sm text-gray-800 font-mono whitespace-pre">
                {data.generated_sql}
              </code>
            </div>

            {/* Results Table */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="min-w-max text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {data.results.length > 0 &&
                      Object.keys(data.results[0]).map((key) => (
                        <th
                          key={key}
                          className="py-3 px-4 text-left font-semibold text-gray-700 border-b whitespace-nowrap"
                        >
                          {key}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {data.results.length === 0 ? (
                    <tr>
                      <td
                        colSpan={100}
                        className="py-8 text-center text-gray-500"
                      >
                        No results found
                      </td>
                    </tr>
                  ) : (
                    data.results.map((row: any, idx: number) => (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        {Object.values(row).map((val: any, i: number) => (
                          <td
                            key={i}
                            className="py-3 px-4 text-gray-900 whitespace-nowrap"
                          >
                            {val !== null && val !== undefined
                              ? String(val)
                              : "N/A"}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Result Count */}
            <p className="text-sm text-gray-600">
              {data.results.length} row(s) returned
            </p>
          </div>
        )}
      </div>
    </div>
  );
}