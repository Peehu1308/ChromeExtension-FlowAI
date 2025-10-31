import React, { useState } from "react";
import { unzipFile } from "../lib/unzip";
import { parseCode } from "../lib/parseCode";
import JSZip from "jszip";

export default function FileUploader() {
  const [status, setStatus] = useState("");
  const [results, setResults] = useState([]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setStatus("📦 Reading ZIP...");
    
    try {
      // Step 1: unzip -> get file paths
      const filePaths = await unzipFile(file);
      const zip = await JSZip.loadAsync(file);

      let parsedFiles = [];

      for (const filePath of filePaths) {
        if (filePath.endsWith(".js") || filePath.endsWith(".ts")) {
          const fileObj = zip.file(filePath);
          if (!fileObj) continue;

          // Step 2: get text source
          const code = await fileObj.async("string");

          setStatus(`🧠 Parsing ${filePath} ...`);

          // Step 3: pass to worker to parse AST
          const parsed = await parseCode(filePath, code);

          parsedFiles.push(parsed);
        }
      }

      setResults(parsedFiles);
      setStatus("✅ Completed!");
    } catch (err) {
      console.error(err);
      setStatus("❌ Failed to read ZIP");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Upload Your Source ZIP</h2>
      <input type="file" accept=".zip" onChange={handleFileUpload} />
      <p>{status}</p>

      {results.length > 0 && (
        <div>
          <h3>Parsed Files:</h3>
          <ul>
            {results.map((res, i) => (
              <li key={i}>
                <strong>{res.filePath}</strong>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: 12 }}>
                  {res.ast}
                </pre>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
