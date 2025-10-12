"use client";

import { useEffect, useState } from "react";
import { LiveKitRoom, RoomAudioRenderer, ControlBar, useParticipants, useTracks } from "@livekit/components-react";
import type { RoomOptions } from "livekit-client";
import { Track } from "livekit-client";
import "@livekit/components-styles";

export default function VoiceRoom({ 
  room, 
  displayName 
}: { 
  room: string; 
  displayName: string;
}) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string>("");
  const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL!;

  useEffect(() => {
    const identity = crypto.randomUUID();
    fetch(
      `/api/livekit/token?room=${encodeURIComponent(room)}&name=${encodeURIComponent(displayName)}&identity=${identity}`
    )
      .then(r => {
        if (!r.ok) throw new Error('Failed to get token');
        return r.json();
      })
      .then(d => setToken(d.token))
      .catch(err => {
        console.error('Token fetch error:', err);
        setError('Failed to connect to voice room');
      });
  }, [room, displayName]);

  const options: RoomOptions = {
    adaptiveStream: true,
    dynacast: true,
    audioCaptureDefaults: { 
      autoGainControl: true, 
      echoCancellation: true, 
      noiseSuppression: true 
    },
    // Ensure audio publishing is enabled for all participants
    publishDefaults: {
      audioPreset: {
        maxBitrate: 20_000,
      },
    },
  };

  if (error) {
    return (
      <main className="space-y-12 relative min-h-screen">
        {/* Background motif to match pricing page */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10"
          style={{
            backgroundColor: '#fff8dc',
            backgroundImage: 'radial-gradient(rgba(201,162,39,0.6) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            backgroundPosition: '0 0',
          }}
        />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center rounded-xl border border-black/10 bg-white/70 backdrop-blur p-8 max-w-md text-slate-900">
            <svg className="w-16 h-16 mx-auto mb-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connection Failed</h2>
            <p className="text-red-500 text-sm mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 font-semibold text-slate-900 bg-gradient-to-r from-yellow-400 to-amber-500 shadow hover:brightness-105 focus:outline-none focus:ring-2 focus:ring-white/30"
            >
              🔄 Retry Connection
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="space-y-12 relative min-h-screen">
        {/* Background motif to match pricing page */}
        <div
          aria-hidden
          className="fixed inset-0 -z-10"
          style={{
            backgroundColor: '#fff8dc',
            backgroundImage: 'radial-gradient(rgba(201,162,39,0.6) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
            backgroundPosition: '0 0',
          }}
        />
        <div className="flex items-center justify-center min-h-screen px-4">
          <div className="text-center rounded-xl border border-black/10 bg-white/70 backdrop-blur p-8 max-w-md text-slate-900">
            <div className="relative mb-6">
              <div className="w-20 h-20 mx-auto rounded-full border-4 border-black/10 border-t-amber-500 animate-spin"></div>
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">Connecting...</h2>
            <p className="text-slate-700 text-sm">Setting up your voice room</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-12 relative min-h-screen">
      {/* Background motif to match pricing page */}
      <div
        aria-hidden
        className="fixed inset-0 -z-10"
        style={{
          backgroundColor: '#fff8dc',
          backgroundImage: 'radial-gradient(rgba(201,162,39,0.6) 1px, transparent 1px)',
          backgroundSize: '36px 36px',
          backgroundPosition: '0 0',
        }}
      />
      
      {/* LiveKit Control Bar Styling */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .lk-control-bar {
            background: transparent !important;
          }
          .lk-control-bar .lk-button,
          .lk-control-bar button.lk-button {
            background: rgba(255, 255, 255, 0.9) !important;
            border: 1px solid rgba(0, 0, 0, 0.1) !important;
            color: #1e293b !important;
            border-radius: 8px !important;
            font-weight: 500 !important;
            padding: 8px 12px !important;
            margin: 0 4px !important;
            display: inline-flex !important;
            align-items: center !important;
            gap: 6px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
          }
          .lk-control-bar .lk-button:hover,
          .lk-control-bar button.lk-button:hover {
            background: rgba(255, 255, 255, 1) !important;
            border-color: rgba(0, 0, 0, 0.2) !important;
            transform: translateY(-1px) !important;
          }
          .lk-control-bar .lk-button[aria-pressed="true"],
          .lk-control-bar button.lk-button[aria-pressed="true"] {
            background: #f59e0b !important;
            color: white !important;
            border-color: #d97706 !important;
          }
          .lk-control-bar .lk-button svg,
          .lk-control-bar button.lk-button svg {
            color: inherit !important;
            fill: currentColor !important;
          }
          .lk-disconnect-button,
          button.lk-disconnect-button {
            background: #ef4444 !important;
            color: white !important;
            border: 1px solid #dc2626 !important;
          }
          .lk-disconnect-button:hover,
          button.lk-disconnect-button:hover {
            background: #dc2626 !important;
            transform: translateY(-1px) !important;
          }
          .lk-device-menu,
          div.lk-device-menu {
            background: white !important;
            border: 1px solid rgba(0, 0, 0, 0.1) !important;
            border-radius: 8px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
            padding: 8px !important;
          }
          .lk-device-menu .lk-button,
          .lk-device-menu button.lk-button {
            color: #1e293b !important;
            background: transparent !important;
            border: none !important;
            padding: 8px 12px !important;
            border-radius: 6px !important;
            width: 100% !important;
            text-align: left !important;
          }
          .lk-device-menu .lk-button:hover,
          .lk-device-menu button.lk-button:hover {
            background: #f8fafc !important;
          }
        `
      }} />
      
      <LiveKitRoom 
        token={token} 
        serverUrl={wsUrl} 
        audio={true}
        video={false} 
        connect={true}
        options={options}
        className="min-h-screen"
        onConnected={() => {
          console.log("Connected to room - audio should be enabled");
        }}
      >
        <RoomAudioRenderer />
        
        {/* Hero Section */}
        <section className="text-center space-y-6 text-slate-900 pt-12">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-full border-2 border-black/10 bg-white/70 backdrop-blur shadow-lg flex items-center justify-center mx-auto">
              <svg className="w-12 h-12 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900">
            Premium Voice Call
          </h1>
          
          <div className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white/70 backdrop-blur px-4 py-2 text-sm text-slate-800">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-semibold">Connected to:</span>
            <span className="font-mono">{room}</span>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid md:grid-cols-3 gap-6 items-stretch max-w-4xl mx-auto px-4">
          <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-6 space-y-3 text-slate-900">
            <h3 className="text-lg font-bold">🎤 Voice Only</h3>
            <p className="text-slate-800">Crystal clear audio without video distractions. Focus on the conversation.</p>
          </div>
          
          <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-6 space-y-3 text-slate-900">
            <h3 className="text-lg font-bold">🔊 Premium Quality</h3>
            <p className="text-slate-800">Echo cancellation, noise suppression, and adaptive streaming for the best experience.</p>
          </div>
          
          <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-6 space-y-3 text-slate-900">
            <h3 className="text-lg font-bold">🌐 Global Access</h3>
            <p className="text-slate-800">Connect with anyone, anywhere. Share the room link to invite participants.</p>
          </div>
        </section>

        {/* Participants Display */}
        <ParticipantsDisplay />

        {/* Instructions */}
        <section className="max-w-2xl mx-auto px-4">
          <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-6 space-y-4 text-slate-900">
            <h2 className="text-xl font-bold">How to use</h2>
            <ul className="list-disc pl-5 text-slate-800 space-y-1">
              <li><strong>Everyone can talk!</strong> Click the microphone button below to unmute and start speaking</li>
              <li>Your microphone starts muted by default - click to enable it</li>
              <li>Share this room link with others to invite them</li>
              <li>Click &quot;Leave&quot; when you&apos;re done with the call</li>
              <li>All participants can hear each other in real-time</li>
            </ul>
          </div>
        </section>

        {/* Control Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-6 flex justify-center">
          <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur shadow-lg px-6 py-4">
            <ControlBar controls={{ camera: false }} />
          </div>
        </div>
      </LiveKitRoom>
    </main>
  );
}

// Participants Display Component
function ParticipantsDisplay() {
  const participants = useParticipants();
  const audioTracks = useTracks([Track.Source.Microphone]);
  
  return (
    <section className="max-w-2xl mx-auto px-4">
      <div className="rounded-xl border border-black/10 bg-white/70 backdrop-blur p-6 space-y-4 text-slate-900">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Participants ({participants.length})</h2>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Live</span>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {participants.map((participant) => {
            const isSpeaking = audioTracks.some(
              track => track.participant.identity === participant.identity && 
              track.publication.isMuted === false
            );
            const isMuted = !audioTracks.some(
              track => track.participant.identity === participant.identity && 
              track.publication.isMuted === false
            );
            
            return (
              <div 
                key={participant.identity}
                className={`rounded-lg border p-3 flex items-center gap-3 transition-all ${
                  isSpeaking 
                    ? 'border-green-500 bg-green-50/50' 
                    : 'border-black/10 bg-white/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  isSpeaking ? 'bg-green-500 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {participant.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{participant.name || 'Guest'}</p>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    {isMuted ? (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                        <span>Muted</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                        <span className="text-green-600">Can talk</span>
                      </>
                    )}
                  </div>
                </div>
                {isSpeaking && (
                  <div className="flex gap-0.5">
                    <div className="w-1 h-4 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-1 h-6 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-1 h-5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-slate-600 text-center pt-2">
          💡 All participants have microphone access. Click the mic button in the control bar to unmute yourself.
        </p>
      </div>
    </section>
  );
}

