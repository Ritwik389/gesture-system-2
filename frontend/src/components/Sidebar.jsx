import React from 'react';

const NAV_ITEMS = [
    {
        id: 'dashboard',
        label: 'Live Dashboard',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
        ),
    },
    {
        id: 'gesture-library',
        label: 'Gesture Library',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11" />
            </svg>
        ),
    },
    {
        id: 'tutorial',
        label: 'Tutorial',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
        ),
    },
    {
        id: 'settings',
        label: 'Settings',
        icon: (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
        ),
    },
];

const SunIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
    </svg>
);

const MoonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
);

export default function Sidebar({ activeSection, onNavigate, theme, onThemeToggle, systemActive, onSystemToggle, onExit }) {
    const isDark = theme === 'synthwave';

    return (
        <aside className="w-64 shrink-0 h-screen flex flex-col bg-base-200 border-r border-base-300 sticky top-0 z-30">

            {/* Logo */}
            <div className="px-6 py-5 border-b border-base-300 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ background: 'linear-gradient(135deg, #ff2d78, #9b4de5)' }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11" />
                    </svg>
                </div>
                <span className="font-black tracking-widest uppercase text-sm">
                    <span className="text-secondary">NEO</span>
                    <span className="text-primary">GESTURE</span>
                </span>
            </div>

            {/* System Active Toggle */}
            <div className="px-4 py-3 border-b border-base-300">
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border transition-all duration-300 ${systemActive
                    ? 'bg-success/10 border-success/40'
                    : 'bg-base-300/50 border-base-300'
                    }`}>
                    <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full transition-all duration-300 ${systemActive ? 'bg-success animate-ping' : 'bg-base-content/30'}`} />
                        <span className={`text-xs font-bold tracking-widest uppercase ${systemActive ? 'text-success' : 'text-base-content/40'}`}>
                            {systemActive ? 'Active' : 'Paused'}
                        </span>
                    </div>
                    <input
                        type="checkbox"
                        className="toggle toggle-sm toggle-success"
                        checked={systemActive}
                        onChange={(e) => onSystemToggle(e.target.checked)}
                    />
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-base-content/30 px-3 mb-3">Navigation</p>
                {NAV_ITEMS.map(item => {
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id)}
                            className={`sidebar-nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-left
                                ${isActive
                                    ? 'bg-primary/15 text-primary border border-primary/20 shadow-[0_0_12px_rgba(var(--p),0.15)]'
                                    : 'text-base-content/60 hover:bg-base-300/70 hover:text-base-content border border-transparent'
                                }`}
                        >
                            <span className={isActive ? 'text-primary' : 'text-base-content/40'}>{item.icon}</span>
                            {item.label}
                            {isActive && (
                                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* Theme toggle & Exit */}
            <div className="p-4 border-t border-base-300 space-y-2">
                <button
                    onClick={onThemeToggle}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl bg-base-300/60 hover:bg-base-300 border border-base-300 transition-all duration-200 group"
                >
                    <div className="flex items-center gap-2.5 text-sm font-medium text-base-content/70 group-hover:text-base-content">
                        {isDark ? <MoonIcon /> : <SunIcon />}
                        <span>{isDark ? 'Dark Mode' : 'Light Mode'}</span>
                    </div>
                    <div className={`w-9 h-5 rounded-full relative transition-all duration-300 ${isDark ? 'bg-primary/40' : 'bg-base-content/20'}`}>
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${isDark ? 'left-4' : 'left-0.5'}`} />
                    </div>
                </button>

                <button
                    onClick={onExit}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-error hover:bg-error/10 border border-transparent transition-all duration-200 text-sm font-medium"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Disconnect
                </button>
            </div>
        </aside>
    );
}