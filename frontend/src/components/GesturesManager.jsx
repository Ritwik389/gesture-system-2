import React, { useState, useEffect } from 'react';
import WebcamTracker from './WebcamTracker';

const ACTIONS = [
    { id: 'none', label: 'Idle Protocol' },
    { id: 'switch_tab', label: 'Switch Tab' },
    { id: 'close_tab', label: 'Close Tab' },
    { id: 'play_pause', label: 'Play / Pause' },
    { id: 'next_track', label: 'Next Track' },
    { id: 'show_desktop', label: 'Show Desktop' },
    { id: 'volume_up', label: 'Volume Up' },
    { id: 'volume_down', label: 'Volume Down' },
    { id: 'mute_toggle', label: 'Toggle Mute' },
    { id: 'open_app', label: 'Launch App' }
];

export default function GesturesManager({ systemActive }) {
    const [config, setConfig] = useState({ gestures: [] });
    const [view, setView] = useState('list'); // 'list', 'detail', 'add'
    const [selectedGesture, setSelectedGesture] = useState(null);

    const fetchConfig = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/config');
            const data = await res.json();
            setConfig(data);
        } catch (e) { console.error("Failed to fetch config", e); }
    };

    useEffect(() => {
        let active = true;
        const loadConfig = async () => {
            try {
                const res = await fetch('http://localhost:8000/api/config');
                const data = await res.json();
                if (active) setConfig(data);
            } catch (e) {
                console.error("Failed to fetch config", e);
            }
        };
        loadConfig();
        const int = setInterval(loadConfig, 3000);
        return () => { active = false; clearInterval(int); };
    }, []);

    const saveGestures = async (newGestures) => {
        setConfig(prev => ({ ...prev, gestures: newGestures }));
        await fetch('http://localhost:8000/api/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newGestures)
        });
    };

    const deleteGesture = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm(`Delete gesture ${id}?`)) return;
        await fetch(`http://localhost:8000/api/gestures/${id}`, { method: 'DELETE' });
        fetchConfig();
        if (selectedGesture?.id === id) setView('list');
    };

    // --- LIST VIEW ---
    if (view === 'list') {
        return (
            <div className="flex flex-col h-full animate-fade-in">
                <div className="flex justify-between items-start mb-8 border-b border-base-300 pb-4">
                    <div>
                        <h2 className="text-3xl font-black text-base-content">Neural Library</h2>
                        <p className="text-base-content/60 mt-1">Manage and train your custom gestures.</p>
                        <p className="text-xs text-base-content/50 mt-2">Note: built-in gestures are non-editable and always active in Live Dashboard:</p>
                        <ul className="text-xs text-base-content/50 list-disc list-inside">
                            <li>Full palm = pointer</li>
                            <li>Index+thumb pinch = left click</li>
                            <li>Pinky+thumb pinch = right click</li>
                        </ul>
                    </div>
                    <button className="btn btn-primary shadow-lg shadow-primary/20" onClick={() => setView('add')}>
                        + New Gesture
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {(!config.gestures || config.gestures.length === 0) ? (
                        <div className="col-span-full py-20 text-center opacity-50 border border-dashed border-base-300 rounded-2xl">
                            No gestures exist. Click New Gesture to begin.
                        </div>
                    ) : (
                        config.gestures.map(g => (
                            <div 
                                key={g.id} 
                                onClick={() => { setSelectedGesture(g); setView('detail'); }}
                                className="bg-base-200 hover:bg-base-300 border border-base-300 hover:border-primary/30 p-4 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-base-100 rounded-xl flex items-center justify-center text-2xl shadow-sm">
                                        {g.emoji || '✋'}
                                    </div>
                                    <h3 className="font-bold text-lg">{g.name}</h3>
                                </div>
                                
                                <button 
                                    onClick={(e) => deleteGesture(g.id, e)} 
                                    className="btn btn-circle btn-sm btn-ghost text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        );
    }


    if (view === 'detail') {
        const currentGesture = config.gestures.find(g => g.id === selectedGesture?.id) || selectedGesture;

        return (
            <GestureDetailView 
                gesture={currentGesture}
                systemActive={systemActive}
                onBack={() => setView('list')}
                onSave={(updated) => {
                    const newGestures = config.gestures.map(g => g.id === updated.id ? updated : g);
                    saveGestures(newGestures);
                }}
            />
        );
    }


    if (view === 'add') {
        return (
            <AddGestureView 
                systemActive={systemActive}
                onBack={() => setView('list')}
                onSave={(newG) => {
                    saveGestures([...(config.gestures || []), newG]);
                    setView('list');
                }}
            />
        );
    }
}

// --- GESTURE DETAIL COMPONENT ---
const GestureDetailView = ({ gesture, systemActive, onBack, onSave }) => {
    const [name, setName] = useState(gesture.name);
    const [action, setAction] = useState(gesture.action);
    const [appPath, setAppPath] = useState(gesture.appPath || '');
    const [recording, setRecording] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [samples, setSamples] = useState([]);
    const [recordStatus, setRecordStatus] = useState(null);
    const [trainStatus, setTrainStatus] = useState(null);

    const stopRecording = async (finalSamples) => {
        setRecording(false);
        try {
            await fetch(`http://localhost:8000/api/gestures/${gesture.id}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ samples: finalSamples })
            });
            setRecordStatus({ type: 'success', text: 'Captured 100 frames successfully!' });
        } catch (err) {
            console.error('Failed to upload dataset', err);
            setRecordStatus({ type: 'error', text: 'Failed to upload dataset.' });
        }
    };

    useEffect(() => {
        const handleLandmarks = (e) => {
            setSamples(prev => {
                if (!recording || countdown > 0 || prev.length >= 100) return prev;
                if (e.detail) {
                    const newSamples = [...prev, e.detail];
                    if (newSamples.length >= 100) {
                        stopRecording(newSamples);
                    }
                    return newSamples;
                }
                return prev;
            });
        };
        window.addEventListener('landmarks_detected', handleLandmarks);
        return () => window.removeEventListener('landmarks_detected', handleLandmarks);
    }, [recording, countdown]);

    const startRecording = () => {
        if (!gesture?.id) return;
        setRecordStatus(null);
        setSamples([]);
        setRecording(true);
        setCountdown(3);
        const int = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { clearInterval(int); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    const handleSave = () => {
        onSave({ ...gesture, name, action, appPath });
        setTrainStatus({ type: 'success', text: 'Metadata saved.' });
        setTimeout(() => setTrainStatus(null), 3000);
    };

    const triggerModelRetrain = async () => {
        try {
            const res = await fetch('http://localhost:8000/api/train', { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                setTrainStatus({ type: 'success', text: `Model trained! Accuracy: ${data.accuracy}%` });
            } else {
                setTrainStatus({ type: 'error', text: `Training failed: ${data.error}` });
            }
        } catch (err) {
            console.error('Train request failed', err);
            setTrainStatus({ type: 'error', text: 'Network error during training.' });
        }
    };

    return (
        <div className="flex flex-col h-full animate-fade-in max-w-5xl mx-auto w-full">
            <button className="btn btn-sm btn-ghost self-start mb-6" onClick={onBack}>
                ← Back to Library
            </button>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column: Metadata Edit */}
                <div className="flex-1 space-y-6 bg-base-200 p-8 rounded-3xl border border-base-300">
                    <div className="flex items-center gap-4 border-b border-base-300 pb-6">
                        <div className="text-6xl">{gesture.emoji}</div>
                        <div>
                            <input 
                                type="text" 
                                className="input input-ghost text-3xl font-black w-full px-0 focus:bg-base-100" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                            />
                            <p className="text-xs font-mono opacity-50 uppercase tracking-widest mt-1">ID: {gesture.id}</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="form-control">
                            <label className="label"><span className="label-text font-bold">Mapped Action</span></label>
                            <select className="select select-bordered bg-base-100" value={action} onChange={e => setAction(e.target.value)}>
                                {ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                            </select>
                        </div>

                        {action === 'open_app' && (
                            <div className="form-control">
                                <label className="label"><span className="label-text font-bold">App Path</span></label>
                                <input type="text" className="input input-bordered bg-base-100 font-mono text-sm" value={appPath} onChange={e => setAppPath(e.target.value)} />
                            </div>
                        )}

                        <button className="btn btn-primary w-full mt-4" onClick={handleSave}>Save Changes</button>
                    </div>

                    {trainStatus && (
                        <div className={`alert ${trainStatus.type === 'success' ? 'alert-success' : 'alert-error'} mt-4`}>
                            <span>{trainStatus.text}</span>
                        </div>
                    )}
                </div>

                {/* Right Column: Retraining Area */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-base-200 p-6 rounded-3xl border border-base-300 flex-1 flex flex-col items-center justify-center text-center relative">
                        <h3 className="absolute top-6 left-6 text-xs font-bold tracking-widest uppercase text-base-content/50">Retrain Gesture</h3>
                        <div className="w-full max-w-[300px] mt-8 space-y-4">
                            <div className="flex gap-3">
                                <div className="form-control w-20">
                                    <label className="label"><span className="label-text font-semibold">Emoji</span></label>
                                    <input type="text" className="input input-bordered text-center text-xl bg-base-100" value={gesture.emoji} disabled />
                                </div>
                                <div className="form-control flex-1">
                                    <label className="label"><span className="label-text font-semibold">Name</span></label>
                                    <input type="text" className="input input-bordered w-full bg-base-100" value={name} disabled />
                                </div>
                            </div>
                            <div className="form-control w-full">
                                <label className="label"><span className="label-text font-semibold">ID</span></label>
                                <input type="text" className="input input-bordered w-full bg-base-100 font-mono text-sm" value={gesture.id} disabled />
                            </div>
                        </div>

                        <div className="radial-progress radial-clean text-primary mb-4 bg-base-200 mt-8" style={{ "--value": samples.length, "--size": "7rem", "--thickness": "0.5rem" }}>
                            <span className="text-xl font-bold text-base-content">{samples.length}%</span>
                        </div>

                        <p className="text-base-content/70 text-xs max-w-[260px] mb-4">Hold your hand still in front of the camera while recording.</p>

                        <button
                            className={`btn w-full max-w-[250px] ${recording ? 'btn-error animate-pulse' : 'btn-secondary'}`}
                            onClick={startRecording}
                            disabled={recording || !gesture?.id}
                        >
                            {countdown > 0 ? `Starting in ${countdown}...` : recording ? `Recording...` : 'Capture 100 Frames'}
                        </button>

                        {recordStatus && (
                            <div className={`alert ${recordStatus.type === 'success' ? 'alert-success' : 'alert-error'} rounded-xl text-sm py-3 mt-4`}>
                                <span>{recordStatus.text}</span>
                            </div>
                        )}
                    </div>

                    <div className="bg-black rounded-3xl overflow-hidden border border-base-300 relative h-64 flex items-center justify-center">
                        <span className="absolute z-20 text-white/50 text-xs tracking-widest uppercase pointer-events-none">Live Sensor preview</span>
                        <WebcamTracker systemActive={systemActive} activeTab="training" />
                    </div>

                    <button className="btn btn-outline w-full" onClick={triggerModelRetrain}>Force System Re-compile</button>
                </div>
            </div>
        </div>
    );
};

// --- ADD GESTURE COMPONENT ---
const AddGestureView = ({ systemActive, onBack, onSave }) => {
    const [id, setId] = useState('');
    const [name, setName] = useState('');
    const [emoji, setEmoji] = useState('✋');
    const [action, setAction] = useState('play_pause');
    const [appPath, setAppPath] = useState('');

    const [recording, setRecording] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [samples, setSamples] = useState([]);
    const [trainStatus, setTrainStatus] = useState(null);

    const stopRecording = async (finalSamples) => {
        setRecording(false);
        try {
            await fetch(`http://localhost:8000/api/gestures/${id}/data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ samples: finalSamples })
            });
            setTrainStatus({ type: 'success', text: `Captured 100 frames successfully!` });
        } catch (err) {
            console.error('Failed to upload dataset during add gesture', err);
            setTrainStatus({ type: 'error', text: 'Failed to upload dataset.' });
        }
    };

    useEffect(() => {
        const handleLandmarks = (e) => {
            setSamples(prev => {
                if (!recording || countdown > 0 || prev.length >= 100) return prev;
                if (e.detail) {
                    const newSamples = [...prev, e.detail];
                    if (newSamples.length >= 100) {
                        stopRecording(newSamples);
                    }
                    return newSamples;
                }
                return prev;
            });
        };
        window.addEventListener('landmarks_detected', handleLandmarks);
        return () => window.removeEventListener('landmarks_detected', handleLandmarks);
    }, [recording, countdown]);

    const startRecording = () => {
        if (!id || !name) {
            setTrainStatus({ type: 'error', text: 'Please fill out the ID and Name first.' }); return;
        }
        setSamples([]);
        setRecording(true);
        setCountdown(3);
        const int = setInterval(() => {
            setCountdown(c => {
                if (c <= 1) { clearInterval(int); return 0; }
                return c - 1;
            });
        }, 1000);
    };

    const finalize = () => {
        if (!id || !name || samples.length < 100) return;
        onSave({ id, name, emoji, action, appPath });
    };

    const step1Done = id && name;
    const isRecorded = samples.length >= 100;

    return (
        <div className="flex flex-col h-full animate-fade-in max-w-5xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-base-300">
                <h2 className="text-2xl font-bold text-base-content">Create New Gesture</h2>
                <button className="btn btn-sm btn-ghost" onClick={onBack}>Cancel</button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 h-full">
                {/* Left Column: Form */}
                <div className="flex-1 space-y-6">
                    <section className="bg-base-200 p-6 rounded-2xl border border-base-300">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-base-content/50 mb-4">1. Metadata</h3>
                        <div className="flex gap-4 mb-4">
                            <div className="form-control flex-1">
                                <label className="label"><span className="label-text font-semibold">Unique ID (lowercase)</span></label>
                                <input autoFocus type="text" className="input input-bordered bg-base-100" value={id} onChange={e => setId(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))} placeholder="e.g. peace_sign" disabled={isRecorded} />
                            </div>
                            <div className="form-control w-24">
                                <label className="label"><span className="label-text font-semibold">Emoji</span></label>
                                <input type="text" className="input input-bordered text-center text-xl bg-base-100" value={emoji} onChange={e => setEmoji(e.target.value)} placeholder="✌️" maxLength={5} />
                            </div>
                        </div>
                        <div className="form-control w-full">
                            <label className="label"><span className="label-text font-semibold">Display Name</span></label>
                            <input type="text" className="input input-bordered w-full bg-base-100" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Peace Sign" />
                        </div>
                    </section>

                    <section className="bg-base-200 p-6 rounded-2xl border border-base-300">
                        <h3 className="text-xs font-bold tracking-widest uppercase text-base-content/50 mb-4">2. Mapped Action</h3>
                        <div className="form-control w-full">
                            <select className="select select-bordered w-full bg-base-100" value={action} onChange={e => setAction(e.target.value)}>
                                {ACTIONS.map(a => <option key={a.id} value={a.id}>{a.label}</option>)}
                            </select>
                        </div>
                        {action === 'open_app' && (
                            <div className="form-control w-full mt-4">
                                <input type="text" className="input input-bordered w-full font-mono text-sm bg-base-100" value={appPath} onChange={e => setAppPath(e.target.value)} placeholder="e.g. /Applications/Spotify.app" />
                            </div>
                        )}
                    </section>
                    
                    {trainStatus && (
                        <div className={`alert ${trainStatus.type === 'success' ? 'alert-success' : 'alert-error'} rounded-xl text-sm py-3`}>
                            <span>{trainStatus.text}</span>
                        </div>
                    )}
                </div>

                {/* Right Column: Training Wizard */}
                <div className="flex-1 flex flex-col gap-4">
                    <div className="bg-base-200 rounded-2xl p-6 border border-base-300 flex flex-col items-center justify-center text-center relative h-64">
                        <h3 className="absolute top-6 left-6 text-xs font-bold tracking-widest uppercase text-base-content/50">3. Record Movement</h3>
                        
                        <div className="radial-progress radial-clean text-primary mb-4 bg-base-200 mt-6" style={{ "--value": samples.length, "--size": "7rem", "--thickness": "0.5rem" }}>
                            <span className="text-xl font-bold text-base-content">{samples.length}%</span>
                        </div>
                        
                        {!isRecorded ? (
                            <>
                                <p className="text-base-content/70 text-xs max-w-[250px] mb-4">Hold your hand still in front of the camera while recording.</p>
                                <button
                                    className={`btn w-full max-w-[250px] ${recording ? 'btn-error animate-pulse' : 'btn-primary'}`}
                                    onClick={startRecording}
                                    disabled={recording || !step1Done}
                                >
                                    {countdown > 0 ? `Starting in ${countdown}...` : recording ? `Recording...` : 'Capture 100 Frames'}
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-success font-semibold text-sm mb-4">Dataset captured successfully.</p>
                                <button className="btn btn-primary w-full max-w-[250px]" onClick={finalize}>
                                    Save New Gesture
                                </button>
                            </>
                        )}
                    </div>

                    <div className="bg-black rounded-2xl overflow-hidden border border-base-300 relative flex-1 min-h-[200px] flex items-center justify-center">
                         <span className="absolute z-20 text-white/50 text-xs tracking-widest uppercase pointer-events-none">Live Sensor preview</span>
                         <WebcamTracker systemActive={systemActive} activeTab="training" />
                    </div>
                </div>
            </div>
        </div>
    );
};
