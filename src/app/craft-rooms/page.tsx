import { Suspense } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { CraftRoomsPage } from "@/components/craft-rooms/craft-rooms-page";

export default function CraftRoomsPageRoute() {
  return (
    <AuthProvider>
      <Suspense fallback={<div>Loading craft rooms...</div>}>
        <CraftRoomsPage />
      </Suspense>
    </AuthProvider>
  );
}

export const metadata = {
  title: "Craft Together - Auret",
  description: "Join collaborative crafting sessions with other creators",
};
