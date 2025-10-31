// src/lib/parseCode.js
export async function parseCode(path, content) {
  if (!content) return { path, error: "Empty file" };

  const functions = [...content.matchAll(/\bfunction\s+([A-Za-z0-9_]+)/g)].map(m => m[1]);
  const arrowFuncs = [...content.matchAll(/const\s+([A-Za-z0-9_]+)\s*=\s*\(/g)].map(m => m[1]);
  const components = [...content.matchAll(/export\s+default\s+function\s+([A-Za-z0-9_]+)/g)].map(m => m[1]);
  const comments = [...content.matchAll(/\/\/(.*)$|\/\*([\s\S]*?)\*\//gm)].map(m => m[1] || m[2]);

  return {
    path,
    functionCount: functions.length + arrowFuncs.length,
    functions: [...functions, ...arrowFuncs],
    components,
    commentCount: comments.length,
  };
}
