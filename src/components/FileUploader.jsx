// src/components/FileUploader.jsx
import React, { useState } from "react";
import { unzipFile } from "../lib/unzip";

export default function FileUploader() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [repoUrl, setRepoUrl] = useState("");

  // handle ZIP upload from local computer
  async function handleZipUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);

    try {
      const fileList = await unzipFile(file);
      setFiles(fileList);
    } catch (err) {
      console.error("Error unzipping file:", err);
    }

    setLoading(false);
  }

  // handle GitHub ZIP download
  async function handleGithubDownload() {
    if (!repoUrl) return alert("Please enter a GitHub repo URL");
    setLoading(true);

    try {
      // Convert repo URL -> zipball endpoint
      // Example: https://github.com/user/repo → https://api.github.com/repos/user/repo/zipball
      const repoPath = repoUrl.replace("https://github.com/", "");
      const apiUrl = `https://api.github.com/repos/${repoPath}/zipball`;

      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error("Failed to fetch repository ZIP");

      const blob = await res.blob();
      const fileList = await unzipFile(blob);
      setFiles(fileList);
    } catch (err) {
      console.error("Error fetching repo:", err);
    }

    setLoading(false);
  }

  return (
    <div className="p-4 flex flex-col gap-3 text-gray-800">
      <h1 className="text-lg font-bold">FlowDoc.ai</h1>

      {/* ZIP upload input */}
      <label className="block">
        <span className="text-sm">Upload a ZIP file:</span>
        <input
          type="file"
          accept=".zip"
          onChange={handleZipUpload}
          className="mt-1 block w-full text-sm"
        />
      </label>

      {/* GitHub repo URL input */}
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

      {/* File list */}
      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : (
        <ul className="border rounded p-2 h-48 overflow-auto text-xs">
          {files.map((file) => (
            <li key={file}>{file}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
