"use client";
import { useState } from "react";
import { Guild } from "./api/wcl/guild/route";
import { GuildMemberData } from "./api/wcl/guildRankings/[id]/route";

export default function Home() {
  const [id, setId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guildData, setGuildData] = useState<Guild | null>(null);
  const [guildMembers, setGuildMembers] = useState<GuildMemberData[]>([]);

  async function fetchGuild() {
    setLoading(true);
    setError(null);
    setGuildData(null);

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
      setGuildData(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGuildRankings() {
    setLoading(true);
    setError(null);
    setGuildMembers([]);

    try {
      const res = await fetch(`/api/wcl/guildRankings/${id}`, {
        method: "GET",
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Unknown error");
      }

      const result = await res.json();
      setGuildMembers(result);
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
        onClick={fetchGuild}
        disabled={!id || loading}
        style={{ padding: "8px 16px" }}
      >
        {loading ? "Loading..." : "Fetch Guild"}
      </button>

      <button
        onClick={fetchGuildRankings}
        disabled={!id || loading}
        style={{ padding: "8px 16px" }}
      >
        {loading ? "Loading..." : "Fetch Guild Rankings"}
      </button>

      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {guildData && (
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
              <td>{guildData.id}</td>
              <td>{guildData.name}</td>
              <td>{guildData.server}</td>
              <td>{guildData.region}</td>
            </tr>
          </tbody>
        </table>
      )}

      {guildData && (
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(guildData, null, 2)}
        </pre>
      )}

      {guildMembers && (
        <pre style={{ marginTop: 20 }}>
          {JSON.stringify(guildMembers, null, 2)}
        </pre>
      )}
    </div>
  );
}
