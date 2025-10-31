// src/lib/unzip.js
import JSZip from "jszip";

/**
 * Reads and lists all file paths inside a .zip file.
 * @param {File|Blob} file - the uploaded zip file
 * @returns {Promise<string[]>} list of file paths
 */
export async function unzipFile(file) {
  const zip = await JSZip.loadAsync(file); // load zip asynchronously
  const files = [];
  
  // iterate through all files inside the archive
  zip.forEach((path) => files.push(path));

  return files; // return list of paths
}
