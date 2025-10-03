"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VideoCall } from "./video-call";
import { RoomChat } from "./room-chat";
import { Users, Settings, LogOut, Video, VideoOff, Mic, MicOff } from "lucide-react";

interface CraftRoom {
  id: string;
  title: string;
  description?: string;
  tags?: string;
  maxParticipants: number;
  participantCount: number;
  hostId: string;
  status: string;
  dailyRoomUrl?: string;
  participants: Array<{
    id: string;
    userId: string;
    role: string;
    joinedAt: string;
    isVideoEnabled: boolean;
    isAudioEnabled: boolean;
  }>;
}

interface CraftRoomPageProps {
  roomId: string;
}

export function CraftRoomPage({ roomId }: CraftRoomPageProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [room, setRoom] = useState<CraftRoom | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  useEffect(() => {
    if (user) {
      fetchRoomDetails();
    }
  }, [roomId, user]);

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch(`/api/craft-rooms/${roomId}`);
      const result = await response.json();
      console.log("Room details response:", result);

      if (result.success) {
        console.log("Room data:", result.data);
        console.log("Daily.co room URL from fetch:", result.data?.dailyRoomUrl);
        console.log("Daily.co room name from fetch:", result.data?.dailyRoomName);
        setRoom(result.data);
        // Check if user is already in the room
        const userParticipant = result.data.participants.find(
          (p: any) => p.userId === user?.uid
        );
        setHasJoined(!!userParticipant);
      } else {
        console.error("Failed to fetch room:", result.error);
        router.push("/craft-rooms");
      }
    } catch (error) {
      console.error("Error fetching room:", error);
      router.push("/craft-rooms");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!user) return;

    setJoining(true);
    try {
      const response = await fetch(`/api/craft-rooms/${roomId}/join`, {
        method: "POST",
      });
      const result = await response.json();

      if (result.success) {
        setHasJoined(true);
        await fetchRoomDetails(); // Refresh room data
      } else {
        console.error("Failed to join room:", result.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("Error joining room:", error);
    } finally {
      setJoining(false);
    }
  };

  const leaveRoom = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/craft-rooms/${roomId}/join`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        router.push("/craft-rooms");
      } else {
        console.error("Failed to leave room:", result.error);
      }
    } catch (error) {
      console.error("Error leaving room:", error);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              You need to sign in to join craft rooms.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/auth/signin")} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading room...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Room Not Found</CardTitle>
            <CardDescription>
              This room doesn't exist or has ended.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push("/craft-rooms")} className="w-full">
              Back to Rooms
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!hasJoined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{room.title}</CardTitle>
                <CardDescription className="text-base">
                  {room.description || "No description provided"}
                </CardDescription>
              </div>
              <Badge variant="secondary">{room.status}</Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Room Info */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center text-sm text-slate-600">
                <Users className="h-4 w-4 mr-2" />
                <span>{room.participantCount} / {room.maxParticipants} participants</span>
              </div>
              
              {room.tags && (
                <div className="flex flex-wrap gap-1">
                  {room.tags.split(" ").filter(Boolean).map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Participants List */}
            {room.participants.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Current Participants</h3>
                <div className="space-y-2">
                  {room.participants.map((participant) => (
                    <div key={participant.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-sm">
                        User {participant.userId.slice(-6)}
                        {participant.role === "host" && (
                          <Badge variant="secondary" className="ml-2 text-xs">Host</Badge>
                        )}
                      </span>
                      <div className="flex items-center space-x-1">
                        {participant.isVideoEnabled ? (
                          <Video className="h-3 w-3 text-green-600" />
                        ) : (
                          <VideoOff className="h-3 w-3 text-slate-400" />
                        )}
                        {participant.isAudioEnabled ? (
                          <Mic className="h-3 w-3 text-green-600" />
                        ) : (
                          <MicOff className="h-3 w-3 text-slate-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Join Actions */}
            <div className="flex space-x-2">
              <Button 
                onClick={joinRoom} 
                disabled={joining || room.participantCount >= room.maxParticipants}
                className="flex-1"
              >
                {joining ? "Joining..." : room.participantCount >= room.maxParticipants ? "Room Full" : "Join Room"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push("/craft-rooms")}
              >
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has joined - show the full room interface
  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="container mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{room.title}</h1>
            <p className="text-sm text-slate-600">
              {room.participantCount} / {room.maxParticipants} participants
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Media Controls */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsVideoEnabled(!isVideoEnabled)}
            >
              {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            >
              {isAudioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>

            {/* Room Settings (host only) */}
            {room.hostId === user.uid && (
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            )}

            {/* Leave Room */}
            <Button variant="outline" size="sm" onClick={leaveRoom}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex">
        {/* Video Area */}
        <div className="flex-1 bg-slate-900">
          <VideoCall
            roomUrl={room.dailyRoomUrl}
            isVideoEnabled={isVideoEnabled}
            isAudioEnabled={isAudioEnabled}
            onVideoToggle={setIsVideoEnabled}
            onAudioToggle={setIsAudioEnabled}
          />
        </div>

        {/* Chat Sidebar */}
        <div className="w-80 border-l bg-white">
          <RoomChat roomId={roomId} />
        </div>
      </div>
    </div>
  );
}
