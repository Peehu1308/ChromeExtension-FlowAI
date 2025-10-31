// src/lib/unzip.js
import JSZip from "jszip";

// ✅ Read all non-ignored files with content
export async function unzipAndReadFiles(file) {
  const blob = file instanceof Blob ? file : new Blob([file]);
  const zip = await JSZip.loadAsync(blob);

  const IGNORED = [".git", "node_modules", "dist", "build"];
  const result = [];

  for (const [filename, entry] of Object.entries(zip.files)) {
    if (IGNORED.some(dir => filename.includes(dir))) continue;
    if (entry.dir) continue;

    // Skip very large files
    if (entry._data && entry._data.uncompressedSize > 200000) continue;

    try {
      const content = await entry.async("string");
      result.push({ path: filename, content });
    } catch (err) {
      console.warn(`Failed to read file ${filename}`, err);
    }
  }

  return result;
}

// ✅ List file names (for display)
export async function unzipFile(file) {
  const blob = file instanceof Blob ? file : new Blob([file]);
  const zip = await JSZip.loadAsync(blob);

  const IGNORED = [".git", "node_modules", "dist", "build"];
  const paths = [];

  for (const [filename, entry] of Object.entries(zip.files)) {
    if (IGNORED.some(dir => filename.includes(dir))) continue;
    if (!entry.dir) paths.push(filename);
  }

  return paths;
}

export default unzipAndReadFiles;
