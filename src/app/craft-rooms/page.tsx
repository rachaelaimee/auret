import { Suspense } from "react";
import { CraftRoomsPage } from "@/components/craft-rooms/craft-rooms-page";

export default function CraftRoomsPageRoute() {
  return (
    <Suspense fallback={<div>Loading craft rooms...</div>}>
      <CraftRoomsPage />
    </Suspense>
  );
}

export const metadata = {
  title: "Craft Together - Auret",
  description: "Join collaborative crafting sessions with other creators",
};
