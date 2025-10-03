"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { CreateRoomDialog } from "./create-room-dialog";
import { useAuth } from "@/components/auth/auth-provider";
import { Navigation } from "@/components/navigation";
import { Users, Video, Clock, Search } from "lucide-react";
import Link from "next/link";

interface CraftRoom {
  id: string;
  title: string;
  description?: string;
  tags?: string[];
  maxParticipants: number;
  participantCount: number;
  hostId: string;
  status: string;
  createdAt: string;
  scheduledStartAt?: string;
}

export function CraftRoomsPage() {
  const { user } = useAuth();
  const [rooms, setRooms] = useState<CraftRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/craft-rooms");
      const result = await response.json();
      
      if (result.success) {
        setRooms(result.data);
      }
    } catch (error) {
      console.error("Failed to fetch rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter(room =>
    room.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    room.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleRoomCreated = (newRoom: CraftRoom) => {
    setRooms(prev => [newRoom, ...prev]);
    setShowCreateDialog(false);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
            <p className="text-slate-600">Loading craft rooms...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100">
      <Navigation user={user} />
      <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Craft Together
        </h1>
        <p className="text-lg text-slate-600 mb-6">
          Join collaborative crafting sessions with other creators. Share techniques, get feedback, and craft together in real-time.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search rooms by title, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {user ? (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Video className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          ) : (
            <div className="text-sm text-slate-500">
              <Link href="/auth/signin?redirect=/craft-rooms" className="text-slate-900 hover:underline">
                Sign in
              </Link> to create rooms
            </div>
          )}
        </div>
      </div>

      {/* Rooms Grid */}
      {filteredRooms.length === 0 ? (
        <div className="text-center py-12">
          <Video className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            {searchQuery ? "No rooms found" : "No active rooms"}
          </h3>
          <p className="text-slate-600 mb-6">
            {searchQuery 
              ? "Try adjusting your search terms"
              : "Be the first to start a collaborative crafting session!"
            }
          </p>
          {user && !searchQuery && (
            <Button onClick={() => setShowCreateDialog(true)}>
              Create the First Room
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRooms.map((room) => (
            <Card key={room.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-1">{room.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {room.description || "No description provided"}
                    </CardDescription>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {room.status}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-3">
                  {/* Tags */}
                  {room.tags && room.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {room.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Participants */}
                  <div className="flex items-center text-sm text-slate-600">
                    <Users className="h-4 w-4 mr-1" />
                    <span>{room.participantCount} / {room.maxParticipants} participants</span>
                  </div>

                  {/* Scheduled time */}
                  {room.scheduledStartAt && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span>
                        {new Date(room.scheduledStartAt).toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Join button */}
                  <div className="pt-2">
                    {user ? (
                      <Link href={`/craft-rooms/${room.id}`}>
                        <Button 
                          className="w-full" 
                          disabled={room.participantCount >= room.maxParticipants}
                        >
                          {room.participantCount >= room.maxParticipants ? "Room Full" : "Join Room"}
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth/signin?redirect=/craft-rooms">
                        <Button variant="outline" className="w-full">
                          Sign in to Join
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Room Dialog */}
      <CreateRoomDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onRoomCreated={handleRoomCreated}
      />
      </div>
    </div>
  );
}
