// src/components/FileSummary.jsx
import React from "react";

export default function FileSummary({ parsedFiles }) {
  if (!parsedFiles || parsedFiles.length === 0) return null;

  return (
    <div className="mt-6">
      <h2 className="text-md font-bold mb-2">Project Summary</h2>
      <table className="text-xs border-collapse w-full">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2 border">File</th>
            <th className="p-2 border">Functions</th>
            <th className="p-2 border">Components</th>
            <th className="p-2 border">Comments</th>
          </tr>
        </thead>
        <tbody>
          {parsedFiles.map(f => (
            <tr key={f.path} className="border-b">
              <td className="p-2 border">{f.path}</td>
              <td className="p-2 border text-center">{f.functionCount}</td>
              <td className="p-2 border text-center">{f.components?.length || 0}</td>
              <td className="p-2 border text-center">{f.commentCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
