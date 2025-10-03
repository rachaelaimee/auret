"use client";

import { useEffect, useRef, useState } from "react";
import DailyIframe from "@daily-co/daily-js";
import { Button } from "@/components/ui/button";
import { Video, VideoOff, Mic, MicOff, Users } from "lucide-react";

interface VideoCallProps {
  roomUrl?: string;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  onVideoToggle: (enabled: boolean) => void;
  onAudioToggle: (enabled: boolean) => void;
}

export function VideoCall({
  roomUrl,
  isVideoEnabled,
  isAudioEnabled,
  onVideoToggle,
  onAudioToggle,
}: VideoCallProps) {
  const callFrameRef = useRef<HTMLDivElement>(null);
  const [callFrame, setCallFrame] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomUrl || !callFrameRef.current) return;

    // Create Daily call frame
    const frame = DailyIframe.createFrame(callFrameRef.current, {
      showLeaveButton: false,
      showFullscreenButton: false,
      showLocalVideo: true,
      showParticipantsBar: false,
      theme: {
        colors: {
          accent: "#1e293b",
          accentText: "#ffffff",
          background: "#0f172a",
          backgroundAccent: "#1e293b",
          baseText: "#ffffff",
          border: "#334155",
          mainAreaBg: "#0f172a",
          mainAreaBgAccent: "#1e293b",
          mainAreaText: "#ffffff",
          supportiveText: "#94a3b8",
        },
      },
    });

    setCallFrame(frame);

    // Event listeners
    frame.on("joined-meeting", () => {
      setHasJoined(true);
      setIsJoining(false);
    });

    frame.on("left-meeting", () => {
      setHasJoined(false);
      setParticipants([]);
    });

    frame.on("participant-joined", (event: any) => {
      setParticipants(prev => [...prev, event.participant]);
    });

    frame.on("participant-left", (event: any) => {
      setParticipants(prev => prev.filter(p => p.session_id !== event.participant.session_id));
    });

    frame.on("error", (event: any) => {
      console.error("Daily error:", event);
      setError("Failed to connect to video call");
      setIsJoining(false);
    });

    // Auto-join the room
    joinCall(frame);

    return () => {
      if (frame) {
        frame.destroy();
      }
    };
  }, [roomUrl]);

  // Update media settings when props change
  useEffect(() => {
    if (callFrame && hasJoined) {
      callFrame.setLocalVideo(isVideoEnabled);
    }
  }, [callFrame, hasJoined, isVideoEnabled]);

  useEffect(() => {
    if (callFrame && hasJoined) {
      callFrame.setLocalAudio(isAudioEnabled);
    }
  }, [callFrame, hasJoined, isAudioEnabled]);

  const joinCall = async (frame: any) => {
    if (!roomUrl) return;

    setIsJoining(true);
    setError(null);

    try {
      await frame.join({
        url: roomUrl,
        startVideoOff: !isVideoEnabled,
        startAudioOff: !isAudioEnabled,
      });
    } catch (err) {
      console.error("Failed to join call:", err);
      setError("Failed to join video call");
      setIsJoining(false);
    }
  };

  const toggleVideo = () => {
    const newState = !isVideoEnabled;
    onVideoToggle(newState);
    if (callFrame && hasJoined) {
      callFrame.setLocalVideo(newState);
    }
  };

  const toggleAudio = () => {
    const newState = !isAudioEnabled;
    onAudioToggle(newState);
    if (callFrame && hasJoined) {
      callFrame.setLocalAudio(newState);
    }
  };

  if (!roomUrl) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <Video className="h-16 w-16 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-semibold mb-2">Video Call Not Available</h3>
          <p className="text-slate-400">Room URL not configured</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="bg-red-600 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <VideoOff className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Connection Failed</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            variant="outline"
            className="text-white border-white hover:bg-white hover:text-slate-900"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (isJoining) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold mb-2">Joining Video Call...</h3>
          <p className="text-slate-400">Please wait while we connect you</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full relative">
      {/* Daily.co iframe container */}
      <div ref={callFrameRef} className="h-full w-full" />

      {/* Floating controls */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <div className="flex items-center space-x-2 bg-black/50 backdrop-blur rounded-lg p-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleVideo}
            className={`text-white hover:bg-white/20 ${
              !isVideoEnabled ? "bg-red-600 hover:bg-red-700" : ""
            }`}
          >
            {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={toggleAudio}
            className={`text-white hover:bg-white/20 ${
              !isAudioEnabled ? "bg-red-600 hover:bg-red-700" : ""
            }`}
          >
            {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
          </Button>

          <div className="flex items-center text-white text-sm px-2">
            <Users className="h-4 w-4 mr-1" />
            <span>{participants.length + (hasJoined ? 1 : 0)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
