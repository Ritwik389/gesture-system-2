import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import Sidebar from './components/Sidebar';
import GesturesManager from './components/GesturesManager';
import WebcamTracker from './components/WebcamTracker'; // Import the tracker here

function App() {
  const [currentView, setCurrentView] = useState('landing');
  // Default to the new dashboard view
  const [activeSection, setActiveSection] = useState('dashboard'); 
  const [systemActive, setSystemActive] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'synthwave';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'synthwave' ? 'light' : 'synthwave');
  };

  if (currentView === 'landing') {
    return <LandingPage onEnter={() => setCurrentView('dashboard')} />;
  }

  return (
    <div className="flex h-screen bg-base-100 text-base-content overflow-hidden font-sans">
      
      <Sidebar 
        activeSection={activeSection} 
        onNavigate={setActiveSection} 
        theme={theme} 
        onThemeToggle={toggleTheme} 
        systemActive={systemActive}
        onSystemToggle={setSystemActive}
        onExit={() => setCurrentView('landing')} // Pass the exit handler
      />

      <main className="flex-1 overflow-y-auto p-6 md:p-10 relative bg-base-100">
        <div className="max-w-screen-xl mx-auto h-full flex flex-col">
          
          {/* --- NEW LIVE DASHBOARD VIEW --- */}
          {activeSection === 'dashboard' && (
             <div className="flex flex-col h-full animate-fade-in max-w-5xl mx-auto w-full">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-base-300">
                    <div>
                        <h2 className="text-3xl font-black text-base-content">System Dashboard</h2>
                        <p className="text-base-content/60 mt-1">Live optical feed and neural event logs.</p>
                    </div>
                </div>

                <div className="flex-1 bg-base-200 p-8 rounded-3xl border border-base-300 flex flex-col gap-6 shadow-sm">
                    {/* Diagnostic Alert */}
                    <div className="alert bg-warning/10 border border-warning/20 text-warning-content rounded-xl shadow-sm py-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="stroke-warning shrink-0 w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        <span className="text-sm">Ensure your terminal has <strong className="font-bold text-warning">Accessibility</strong> privileges in Mac System Settings for gesture actions to execute.</span>
                    </div>

                    {/* The Tracker Component natively handles the camera + logs when activeTab="dashboard" */}
                    <div className="flex-1">
                        <WebcamTracker systemActive={systemActive} activeTab="dashboard" />
                    </div>
                </div>
             </div>
          )}

          {activeSection === 'gesture-library' && (
             <GesturesManager systemActive={systemActive} />
          )}

          {activeSection === 'tutorial' && (
            <div className="flex flex-col h-full gap-6 p-6 overflow-y-auto rounded-3xl bg-base-200 border border-base-300">
              <h2 className="text-3xl font-black text-base-content">Gesture Tutorial</h2>
              <p className="text-base-content/70">The app now includes three built-in hardcoded gestures (non-editable):</p>
              <ul className="list-disc list-inside space-y-2 text-base-content/80">
                <li><strong>Full Palm:</strong> Keep all fingers extended. Controls pointer position via index finger tip.</li>
                <li><strong>Index + Thumb Pinch:</strong> Bring index tip and thumb tip together. Triggers left click.</li>
                <li><strong>Pinky + Thumb Pinch:</strong> Bring pinky tip and thumb tip together. Triggers right click.</li>
              </ul>
              <p className="text-sm text-base-content/60">Built-in gestures are hardcoded and bypass custom gesture training. They appear in the floating indicator on the video feed.</p>
              <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
                <h3 className="font-bold mb-2">Usage flow</h3>
                <ol className="list-decimal list-inside space-y-2 text-sm text-base-content/80">
                  <li>Enable system switch in sidebar.</li>
                  <li>Hold your hand near camera with front of palm visible.</li>
                  <li>For pointer mode, open palm fully; move cursor position with index finger tip.</li>
                  <li>For left click, pinch index and thumb.</li>
                  <li>For right click, pinch pinky and thumb.</li>
                  <li>Monitor logs in dashboard for trigger events.</li>
                </ol>
              </div>
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="flex flex-col items-center justify-center h-full opacity-50 text-center gap-4">
               <span className="text-6xl">⚙️</span>
               <h2 className="text-2xl font-bold">System Configuration</h2>
               <p>Advanced preferences coming soon...</p>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

export default App;