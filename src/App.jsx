// src/App.jsx
import React from "react";
import FileUploader from "./components/FileUploader";
import "./index.css";

function App() {
  return (
    <div className="w-[300px] min-h-[400px] bg-white">
      <FileUploader />
    </div>
  );
}

export default App;
