// src/lib/summarizeCode.js

export async function summarizeCode(parsedFiles) {
  // Check if the on-device Summarizer API is available
  if (!('ai' in self) || !('summarizer' in self.ai)) {
    console.warn("📦 Summarizer API not available in this browser.");
    throw new Error("Summarizer API not available");
  }

  // Create a session
  const canSummarize = await self.ai.summarizer.capabilities();
  console.log("📦 Summarizer availability:", canSummarize);

  // Some systems show "eligible: false" if Chrome thinks the device isn't allowed
  if (!canSummarize.available && !canSummarize.allowed) {
    throw new Error("Summarizer model not available or not ready.");
  }

  // 🧠 Create the summarizer session — specify the output language explicitly
  const summarizer = await self.ai.summarizer.create({
    type: "tl;dr",
    format: "plain_text",
    outputLanguage: "en", // ✅ required, fixes your “No output language” error
  });

  // Combine code contents
  const combined = parsedFiles
    .map(f => `File: ${f.path}\n${f.content}`)
    .join("\n\n---\n\n");

  // Run summarization
  const result = await summarizer.summarize(combined);

  return result || "No summary generated.";
}
