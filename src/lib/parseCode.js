// src/lib/parseCode.js
export async function parseCode(filePath, code) {
  return new Promise((resolve) => {
    const worker = new Worker(new URL("../workers/parser.worker.js", import.meta.url));

    worker.postMessage({ filePath, code });

    worker.onmessage = (e) => {
      resolve(e.data); // { filePath, ast }
      worker.terminate();
    };
  });
}
