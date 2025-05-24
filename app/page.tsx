"use client";

import dynamic from "next/dynamic";

// Dynamically import the TldrawEditor component to avoid SSR issues
const TldrawEditor = dynamic(() => import("./components/TldrawEditor"), {
  ssr: false,
});

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <header className="p-4 bg-gray-100 dark:bg-gray-800">
        <h1 className="text-2xl font-bold">Tldraw MCP Demo</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Controlled by Claude via MCP protocol
        </p>
      </header>
      <main className="flex-grow">
        <TldrawEditor />
      </main>
    </div>
  );
}
