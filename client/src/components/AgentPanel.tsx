import React, { useState } from "react";

export const AgentPanel = () => {
  const [output, setOutput] = useState("");
  const [task, setTask] = useState("");
  const [agentType, setAgentType] = useState("engineering");

  const handleRun = async () => {
    const res = await fetch("/api/mcp/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ agentType, task, context: {} }),
    });
    const data = await res.json();
    setOutput(data.output);
  };

  return (
    <div className="p-4 border rounded bg-white shadow max-w-xl mx-auto mt-8">
      <h2 className="text-lg font-bold mb-2">AI Agent Panel</h2>
      <select
        className="border p-2 rounded mb-2 w-full"
        value={agentType}
        onChange={e => setAgentType(e.target.value)}
      >
        <option value="engineering">Engineering</option>
        <option value="data">Data Science</option>
        <option value="pm">Product/UX</option>
      </select>
      <input
        value={task}
        onChange={e => setTask(e.target.value)}
        placeholder="Describe your task (e.g., Generate React component)"
        className="border p-2 w-full mb-2"
      />
      <button
        onClick={handleRun}
        className="px-4 py-2 bg-blue-600 text-white rounded w-full"
      >
        Run Agent
      </button>
      <pre className="mt-4 bg-gray-100 p-2 text-sm whitespace-pre-wrap">{output}</pre>
    </div>
  );
};

export default AgentPanel;
