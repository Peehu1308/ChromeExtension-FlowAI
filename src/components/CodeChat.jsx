import React, { useState } from "react";
import { summarizeCode } from "../lib/summarizeCode";

export default function CodeChat({ parsedFiles }) {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");

  async function ask() {
    const res = await summarizeCode([
      { file: "query", content: query, parsedFiles },
    ]);
    setAnswer(res);
  }

  return (
    <div className="mt-4 border-t pt-2">
      <h3 className="font-bold text-sm mb-1">Ask about the code:</h3>
      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. What does initApp() do?"
          className="border p-1 rounded flex-1 text-sm"
        />
        <button
          onClick={ask}
          className="bg-indigo-600 text-white px-3 py-1 rounded text-sm"
        >
          Ask
        </button>
      </div>
      {answer && (
        <p className="mt-2 text-sm bg-gray-50 p-2 rounded">{answer}</p>
      )}
    </div>
  );
}
