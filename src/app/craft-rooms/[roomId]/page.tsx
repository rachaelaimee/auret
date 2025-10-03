import { Suspense } from "react";
import { CraftRoomPage } from "@/components/craft-rooms/craft-room-page";

interface PageProps {
  params: {
    roomId: string;
  };
}

export default function CraftRoomPageRoute({ params }: PageProps) {
  return (
    <Suspense fallback={<div>Loading room...</div>}>
      <CraftRoomPage roomId={params.roomId} />
    </Suspense>
  );
}

export const metadata = {
  title: "Craft Room - Auret",
  description: "Join a collaborative crafting session",
};
