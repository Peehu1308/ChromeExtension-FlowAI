// src/components/FileUploader.jsx
import React, { useState } from "react";
import unzipFile, { unzipAndReadFiles } from "../lib/unzip";
import { parseCode } from "../lib/parseCode";
import FileSummary from "./FileSummary";
import CodeChat from "./CodeChat";
import DependencyGraph from "./DependencyGraph";

export default function FileUploader() {
  const [files, setFiles] = useState([]); // [{path, content}]
  const [parsedFiles, setParsedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [zipBlob, setZipBlob] = useState(null);
  const [progress, setProgress] = useState("");
  const [summary, setSummary] = useState(""); // 🧠 summary output
  const [search, setSearch] = useState(""); // 🔍 search term

  // ✅ Upload ZIP from local disk
  async function handleZipUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    setLoading(true);
    setProgress("Unzipping local file...");

    try {
      const fileList = await unzipAndReadFiles(file);
      setFiles(fileList);
      setZipBlob(file);
      setProgress(`Loaded ${fileList.length} files`);
    } catch (err) {
      console.error("Error unzipping:", err);
      alert("Failed to unzip file");
    }

    setLoading(false);
  }

  // ✅ Fetch ZIP from GitHub
  async function handleGithubDownload() {
    if (!repoUrl) return alert("Please enter a GitHub repo URL");
    setLoading(true);
    setProgress("Downloading repo...");

    try {
      const repoPath = repoUrl
        .replace("https://github.com/", "")
        .replace(/\/$/, ""); // remove trailing slash
      const apiUrl = `https://api.github.com/repos/${repoPath}/zipball`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`Failed to fetch ZIP: ${res.statusText}`);

      const buffer = await res.arrayBuffer();
      const blob = new Blob([buffer]);
      const fileList = await unzipAndReadFiles(blob);

      setFiles(fileList);
      setZipBlob(blob);
      setProgress(`Loaded ${fileList.length} files`);
    } catch (err) {
      console.error("GitHub fetch error:", err);
      alert("Failed to download or unzip the GitHub repo ZIP");
    }

    setLoading(false);
  }

  // ✅ Parse all .js / .ts files
  async function handleParse() {
    if (!files || files.length === 0) return alert("Upload a ZIP first!");
    setLoading(true);
    setProgress("Parsing code files...");

    const results = [];
    let count = 0;

    try {
      for (const { path, content } of files) {
        if (path.endsWith(".js") || path.endsWith(".ts")) {
          const parsed = await parseCode(path, content);
          results.push(parsed);
        }
        count++;
        if (count % 10 === 0) setProgress(`Parsed ${count}/${files.length} files`);
      }

      setParsedFiles(results);
      setProgress(`Done! Parsed ${results.length} JS/TS files`);
    } catch (err) {
      console.error("Parse error:", err);
      alert("Parsing failed");
    }

    setLoading(false);
  }

  // 🧠 NEW: Local Summarization with Chrome Summarizer API (Gemini Nano)
  async function handleSummarize() {
    if (parsedFiles.length === 0) return alert("Parse code first!");
    setLoading(true);
    setProgress("Checking summarizer availability...");

    try {
      if (!("Summarizer" in self)) {
        throw new Error("Summarizer API not supported. Use Chrome 138+ desktop.");
      }

      const availability = await Summarizer.availability();
      console.log("📦 Summarizer availability:", availability);

      if (availability === "unavailable") {
        throw new Error("Summarizer model not available or not ready.");
      }

      const text = JSON.stringify(parsedFiles).slice(0, 15000);

      // Create summarizer instance
      const summarizer = await Summarizer.create({
        type: "key-points", // or 'tldr' / 'headline'
        format: "markdown",
        length: "medium",
        sharedContext: "Summarizing repository code structure and purpose for developers.",
        monitor(m) {
          m.addEventListener("downloadprogress", (e) => {
            const percent = Math.round(e.loaded * 100);
            setProgress(`📥 Downloading model... ${percent}%`);
          });
        },
      });

      setProgress("Generating summary...");
      const summaryText = await summarizer.summarize(text, {
        context: "This is a JavaScript/React project. Summarize its purpose and modules clearly.",
      });

      setSummary(summaryText);
      setProgress("✅ Summary ready!");
    } catch (err) {
      console.error("Summarization error:", err);
      alert(`Failed to summarize: ${err.message}`);
    }

    setLoading(false);
  }

  // 🔍 Filtered file list based on search term
  const filteredFiles = files.filter((f) =>
    f.path.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 flex flex-col gap-3 text-gray-800">
      <h1 className="text-lg font-bold">FlowDoc.ai</h1>

      {/* Upload */}
      <label className="block">
        <span className="text-sm">Upload a ZIP file:</span>
        <input
          type="file"
          accept=".zip"
          onChange={handleZipUpload}
          className="mt-1 block w-full text-sm"
        />
      </label>

      {/* GitHub */}
      <label className="block">
        <span className="text-sm">Or GitHub repo URL:</span>
        <div className="flex gap-2 mt-1">
          <input
            type="text"
            placeholder="https://github.com/user/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="border rounded p-1 flex-1 text-sm"
          />
          <button
            onClick={handleGithubDownload}
            className="bg-blue-500 text-white px-3 py-1 rounded text-sm"
          >
            Fetch
          </button>
        </div>
      </label>

      {/* Parse */}
      <button
        onClick={handleParse}
        disabled={loading || files.length === 0}
        className="bg-green-600 text-white p-2 rounded text-sm"
      >
        {loading ? "Processing..." : "Parse Code Files"}
      </button>

      {/* 🧠 Summarize */}
      <button
        onClick={handleSummarize}
        disabled={loading || parsedFiles.length === 0}
        className="bg-purple-600 text-white p-2 rounded text-sm"
      >
        {loading ? "Processing..." : "Summarize Repository"}
      </button>

      {progress && (
        <p className="text-xs text-gray-500 italic">{progress}</p>
      )}

      {/* File list with search */}
      <div>
        <h3 className="font-bold text-sm mt-2">Files Found:</h3>
        <input
          placeholder="🔍 Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-1 rounded text-sm w-full mb-2"
        />

        <ul className="border rounded p-2 h-48 overflow-auto text-xs">
          {filteredFiles.length === 0 ? (
            <li className="text-gray-400">No matching files found</li>
          ) : (
            filteredFiles.map((f) => <li key={f.path}>{f.path}</li>)
          )}
        </ul>
      </div>

      {/* Parsed output */}
      {parsedFiles.length > 0 && (
        <div>
          <h3 className="font-bold mt-4 text-sm">Parsed Output:</h3>
          <pre className="text-xs bg-gray-100 p-2 rounded h-48 overflow-auto">
            {JSON.stringify(parsedFiles, null, 2)}
          </pre>
        </div>
      )}

      {/* 🧠 AI Summary Section */}
      {summary && (
        <div className="bg-purple-50 border border-purple-200 rounded p-3 mt-3">
          <h3 className="font-bold text-sm text-purple-700">AI Summary:</h3>
          <p className="whitespace-pre-wrap text-gray-700 text-sm mt-2">{summary}</p>
        </div>
      )}

      {parsedFiles.length > 0 && <CodeChat parsedFiles={parsedFiles} />}
      {parsedFiles.length > 0 && (
        <>
          <h3 className="font-bold mt-4 text-sm">📊 Architecture Graph</h3>
          <DependencyGraph data={parsedFiles} />
        </>
      )}

      <FileSummary parsedFiles={parsedFiles} />
    </div>
  );
}
