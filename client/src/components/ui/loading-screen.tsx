import React from "react";

// Optimized loading screen component with minimal dependencies
export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 flex items-center justify-center flex-col bg-gray-50 z-50">
      <div className="w-16 h-16 mb-4 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin"></div>
      <h2 className="text-xl font-medium text-gray-600">Loading TerraFusion...</h2>
    </div>
  );
}