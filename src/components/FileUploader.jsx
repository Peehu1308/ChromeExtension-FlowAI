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
// ✅ Updated handleGithubDownload
async function handleGithubDownload() {
  if (!repoUrl) return alert("Please enter a GitHub repo URL");
  setLoading(true);
  setProgress("Fetching repository...");

  try {
    // Extract <username>/<repo>
    const repoPath = repoUrl
      .replace("https://github.com/", "")
      .replace(/\/$/, "");

    async function fetchZip(branch) {
     const url = `https://api.allorigins.win/raw?url=https://api.github.com/repos/${repoPath}/zipball/${branch}`;

      const res = await fetch(url);

      if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
      const buffer = await res.arrayBuffer();

      // Check if it's a valid ZIP (starts with "PK")
      const bytes = new Uint8Array(buffer.slice(0, 2));
      if (!(bytes[0] === 0x50 && bytes[1] === 0x4b)) {
        throw new Error("Response is not a valid ZIP file");
      }

      return buffer;
    }

    let zipBuffer;
    try {
      zipBuffer = await fetchZip("main");
    } catch {
      zipBuffer = await fetchZip("master");
    }

    setProgress("Unzipping files...");
    const blob = new Blob([zipBuffer]);
    const fileList = await unzipAndReadFiles(blob);

    setFiles(fileList);
    setZipBlob(blob);
    setProgress(`✅ Loaded ${fileList.length} files successfully`);
  } catch (err) {
    console.error("GitHub fetch error:", err);
    alert(`GitHub fetch failed: ${err.message}`);
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
  <div className="flowdoc-wrapper">
    {/* --- HERO SECTION --- */}
    <section className="hero-section">
      <div className="particle-bg">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle"></div>
        ))}
      </div>

      <div className="hero-content">
        <h1 className="hero-title">FlowDoc.ai</h1>
        <p className="hero-subtitle">Your Local AI Code Interpreter</p>
        <p className="hero-description">
          Upload your code or GitHub repository and let FlowDoc.ai explain, summarize, and
          visualize your code — all on-device with Chrome’s Gemini Nano. Fast, private, and intelligent.
        </p>
        <a href="#app-panel" className="scroll-btn">Start Now ↓</a>
      </div>
    </section>

    {/* --- MAIN APP PANEL --- */}
    <section id="app-panel" className="app-panel">
      <div className="panel-header">
        <h2 className="panel-title">Analyze Your Codebase</h2>
        <p className="panel-subtitle">Upload a ZIP file or link a GitHub repo to begin.</p>
      </div>

      {/* Upload */}
      <label className="form-section">
        <span className="label-text">Upload a ZIP file:</span>
        <input type="file" accept=".zip" onChange={handleZipUpload} className="input-file" />
      </label>

      {/* GitHub */}
      <label className="form-section">
        <span className="label-text">Or load from GitHub:</span>
        <div className="input-group">
          <input
            type="text"
            placeholder="https://github.com/user/repo"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="input-box"
          />
          <button onClick={handleGithubDownload} className="btn btn-blue">
            Fetch
          </button>
        </div>
      </label>

      {/* Buttons */}
      <div className="button-group">
        <button
          onClick={handleParse}
          disabled={loading || files.length === 0}
          className="btn btn-green"
        >
          {loading ? "Processing..." : "Parse Code Files"}
        </button>

        <button
          onClick={handleSummarize}
          disabled={loading || parsedFiles.length === 0}
          className="btn btn-purple"
        >
          {loading ? "Processing..." : "Summarize Repository"}
        </button>
      </div>

      {progress && <p className="progress-text">{progress}</p>}

      {/* File list */}
      <div className="file-list-section">
        <h3 className="section-subtitle">Files Found:</h3>
        <input
          placeholder="Search files..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-box"
        />
        <ul className="file-list">
          {filteredFiles.length === 0 ? (
            <li className="empty-text">No matching files found</li>
          ) : (
            filteredFiles.map((f) => <li key={f.path}>{f.path}</li>)
          )}
        </ul>
      </div>

      {/* Parsed Output */}
      {parsedFiles.length > 0 && (
        <div className="parsed-output">
          <h3 className="section-subtitle">Parsed Output:</h3>
          <pre className="code-box">{JSON.stringify(parsedFiles, null, 2)}</pre>
        </div>
      )}

      {/* AI Summary */}
      {summary && (
        <div className="summary-section">
          <h3 className="section-subtitle">AI Summary:</h3>
          <p className="summary-text">{summary}</p>
        </div>
      )}

      {parsedFiles.length > 0 && <CodeChat parsedFiles={parsedFiles} />}
      {parsedFiles.length > 0 && (
        <>
          <h3 className="section-subtitle">Architecture Graph</h3>
          <DependencyGraph data={parsedFiles} />
        </>
      )}

      <FileSummary parsedFiles={parsedFiles} />
    </section>
  </div>
);



}
