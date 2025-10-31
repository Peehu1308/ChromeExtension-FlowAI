// src/components/FileUploader.jsx
import React, { useState } from "react";
import unzipFile, {unzipAndReadFiles } from "../lib/unzip";
import { parseCode } from "../lib/parseCode";
import FileSummary from "./FileSummary";

export default function FileUploader() {
  const [files, setFiles] = useState([]); // [{path, content}]
  const [parsedFiles, setParsedFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");
  const [zipBlob, setZipBlob] = useState(null);
  const [progress, setProgress] = useState("");

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

      {progress && (
        <p className="text-xs text-gray-500 italic">{progress}</p>
      )}

      {/* File list */}
      <div>
        <h3 className="font-bold text-sm mt-2">Files Found:</h3>
        <ul className="border rounded p-2 h-48 overflow-auto text-xs">
          {files.length === 0 ? (
            <li className="text-gray-400">No files loaded yet</li>
          ) : (
            files.map((f) => <li key={f.path}>{f.path}</li>)
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

      <FileSummary parsedFiles={parsedFiles} />
    </div>
    
  );
}
