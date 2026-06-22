import React, { useState, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import perfMonitor from "../../utils/performanceMonitor";

const PerformanceDashboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [metrics, setMetrics] = useState(null);
  const [vitals, setVitals] = useState(null);
  const [resources, setResources] = useState(null);

  useEffect(() => {
    // Collect metrics after page load
    const timer = setTimeout(() => {
      setMetrics(perfMonitor.getMetrics());
      setVitals(perfMonitor.getCoreWebVitals());
      setResources(perfMonitor.getResourceMetrics());
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!isOpen && !metrics) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-mono text-sm">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
        >
          📊 Performance
          <ChevronDown size={16} />
        </button>
      ) : (
        <div className="bg-gray-900 border border-cyan-500 rounded-lg shadow-2xl p-4 max-h-[80vh] overflow-y-auto text-white w-96">
          <div className="flex justify-between items-center mb-4 border-b border-cyan-500 pb-2">
            <h2 className="text-lg font-bold text-cyan-400">📊 Performance Dashboard</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Web Vitals */}
          {vitals && (
            <div className="mb-4">
              <h3 className="text-cyan-400 font-bold mb-2">🚀 Web Vitals</h3>
              <div className="bg-gray-800 p-3 rounded text-xs space-y-1">
                <p>
                  FCP: <span className="text-green-400">{vitals.FCP || "N/A"}ms</span>
                </p>
                <p>
                  LCP: <span className="text-green-400">{vitals.LCP || "N/A"}ms</span>
                </p>
                <p>
                  TTFB: <span className="text-green-400">{vitals.TTFB || "N/A"}ms</span>
                </p>
              </div>
            </div>
          )}

          {/* Component Metrics */}
          {metrics && Object.keys(metrics).length > 0 && (
            <div className="mb-4">
              <h3 className="text-cyan-400 font-bold mb-2">⚡ Component Load Times</h3>
              <div className="bg-gray-800 p-3 rounded text-xs space-y-1 max-h-40 overflow-y-auto">
                {Object.entries(metrics)
                  .sort((a, b) => b[1] - a[1])
                  .map(([name, time]) => (
                    <p key={name} className="flex justify-between">
                      <span>{name}</span>
                      <span className="text-yellow-400">{time.toFixed(2)}ms</span>
                    </p>
                  ))}
              </div>
            </div>
          )}

          {/* Resource Summary */}
          {resources && (
            <div className="mb-4">
              <h3 className="text-cyan-400 font-bold mb-2">📦 Resources</h3>
              <div className="bg-gray-800 p-3 rounded text-xs space-y-1">
                <p>
                  Total: <span className="text-blue-400">{resources.totalResources}</span>
                </p>
                <p>
                  Images: <span className="text-purple-400">{resources.images.length}</span>
                </p>
                <p>
                  Scripts: <span className="text-orange-400">{resources.scripts.length}</span>
                </p>
                <p>
                  Stylesheets: <span className="text-pink-400">{resources.stylesheets.length}</span>
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-cyan-500">
            <button
              onClick={() => perfMonitor.printFullReport()}
              className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white px-2 py-1 rounded text-xs"
            >
              Print Report
            </button>
            <button
              onClick={() => perfMonitor.reset()}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-2 py-1 rounded text-xs"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceDashboard;
