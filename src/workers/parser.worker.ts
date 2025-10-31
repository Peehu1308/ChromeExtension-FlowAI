// src/workers/parser.worker.js
import Parser from "web-tree-sitter";

// Wait for messages from the main thread
self.onmessage = async (e) => {
  const { code, filePath } = e.data;

  await Parser.init();                     // Load the WebAssembly runtime
  const parser = new Parser();

  // You’ll need the JS grammar .wasm file in /public
  const Lang = await Parser.Language.load("/tree-sitter-javascript.wasm");
  parser.setLanguage(Lang);

  // Parse the file’s source code into an AST
  const tree = parser.parse(code);

  // Send the result back to the UI
  self.postMessage({
    filePath,
    ast: tree.rootNode.toString(),
  });
};
