"use client";
import { useState } from "react";
import { Guild } from "./api/wcl/guild/route";

export default function Home() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Guild | null>(null);

  async function fetchData() {
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const res = await fetch("/api/wcl/guild", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Unknown error");
      }

      const result = await res.json();
      setData(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ maxWidth: 600, margin: "2rem auto", fontFamily: "sans-serif" }}
    >
      <h1>Query Guild by ID</h1>

      <input
        type="text"
        placeholder="Enter ID"
        value={id}
        onChange={(e) => setId(e.target.value)}
        style={{ padding: 8, width: "100%", marginBottom: 12 }}
      />

      <button
        onClick={fetchData}
        disabled={!id || loading}
        style={{ padding: "8px 16px" }}
      >
        {loading ? "Loading..." : "Fetch Data"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {data && (
        <table
          border={1}
          cellPadding={8}
          style={{ marginTop: 20, width: "100%" }}
        >
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Server</th>
              <th>Region</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>{data.id}</td>
              <td>{data.name}</td>
              <td>{data.server}</td>
              <td>{data.region}</td>
            </tr>
          </tbody>
        </table>
      )}

      {data && (
        <pre style={{ marginTop: 20 }}>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  );
}
