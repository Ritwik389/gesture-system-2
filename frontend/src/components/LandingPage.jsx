import React, { useEffect, useRef } from 'react';
import NET from 'vanta/dist/vanta.net.min';
import * as THREE from 'three';

export default function LandingPage({ onEnter }) {
    const vantaRef = useRef(null);
    const vantaEffect = useRef(null);

    useEffect(() => {
        if (!vantaEffect.current) {
            vantaEffect.current = NET({
                el: vantaRef.current,
                THREE,
                mouseControls: true,
                touchControls: true,
                gyroControls: false,
                minHeight: 200.0,
                minWidth: 200.0,
                scale: 1.0,
                scaleMobile: 1.0,
                color: 0xff2d78,
                backgroundColor: 0x0d0221,
                points: 12.0,
                maxDistance: 22.0,
                spacing: 18.0,
            });
        }
        return () => {
            if (vantaEffect.current) {
                vantaEffect.current.destroy();
                vantaEffect.current = null;
            }
        };
    }, []);

    return (
        <div ref={vantaRef} className="min-h-screen w-full flex items-center justify-center relative overflow-hidden">
            {/* Gradient overlays for depth */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none z-[1]" />
            <div className="absolute inset-0 bg-gradient-to-r from-purple-900/20 via-transparent to-pink-900/20 pointer-events-none z-[1]" />

            <div className="landing-content text-center px-6 max-w-3xl mx-auto">

                {/* Eyebrow badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8 text-xs font-semibold tracking-[0.25em] uppercase text-pink-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
                    Gesture Intelligence System
                </div>

                {/* Main heading */}
                <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-6 leading-none">
                    <span className="text-white drop-shadow-[0_0_40px_rgba(255,255,255,0.15)]">NEO</span>
                    <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent drop-shadow-[0_0_60px_rgba(255,45,120,0.5)]">
                        GESTURE
                    </span>
                </h1>

                {/* Descriptor */}
                <p className="text-base md:text-lg text-white/60 max-w-xl mx-auto mb-12 leading-relaxed font-light tracking-wide">
                    Control your desktop with the wave of a hand. Train custom gestures,
                    map them to actions, and command your machine — no touch required.
                </p>

                {/* CTA Button */}
                <button
                    onClick={onEnter}
                    className="group relative inline-flex items-center gap-3 px-10 py-4 rounded-2xl font-bold text-base md:text-lg tracking-wide text-white overflow-hidden shadow-[0_0_40px_rgba(255,45,120,0.3)] transition-all duration-300 hover:shadow-[0_0_60px_rgba(255,45,120,0.5)] hover:scale-105 active:scale-100"
                    style={{
                        background: 'linear-gradient(135deg, #ff2d78 0%, #9b4de5 100%)',
                    }}
                >
                    <span className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all duration-300 rounded-2xl" />
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11" />
                    </svg>
                    <span className="relative z-10">Get ready to transform your PC</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </button>

                {/* Bottom hint */}
                <p className="mt-8 text-white/25 text-xs tracking-widest uppercase font-medium">
                    Powered by MediaPipe · FastAPI · React
                </p>
            </div>
        </div>
    );
}
