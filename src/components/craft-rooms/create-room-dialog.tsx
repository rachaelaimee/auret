"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/components/auth/auth-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const createRoomSchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().optional(),
  tags: z.string().optional(),
  maxParticipants: z.number().min(2).max(50),
  isPublic: z.boolean(),
  requiresApproval: z.boolean(),
  scheduledStartAt: z.string().optional(),
});

type CreateRoomForm = z.infer<typeof createRoomSchema>;

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRoomCreated: (room: any) => void;
}

export function CreateRoomDialog({ open, onOpenChange, onRoomCreated }: CreateRoomDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const form = useForm<CreateRoomForm>({
    resolver: zodResolver(createRoomSchema),
    defaultValues: {
      title: "",
      description: "",
      tags: "",
      maxParticipants: 8,
      isPublic: true,
      requiresApproval: false,
    },
  });

  const onSubmit = async (data: CreateRoomForm) => {
    if (!user) return;
    
    setLoading(true);
    try {
      // Get the user's ID token for authentication
      const idToken = await user.getIdToken();
      
      const response = await fetch("/api/craft-rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          ...data,
          tags: data.tags ? data.tags.split(' ').filter(Boolean) : [],
        }),
      });

      const result = await response.json();

      if (result.success) {
        onRoomCreated(result.data);
        form.reset();
      } else {
        console.error("Failed to create room:", result.error);
        // TODO: Show error toast
      }
    } catch (error) {
      console.error("Error creating room:", error);
      // TODO: Show error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Craft Room</DialogTitle>
          <DialogDescription>
            Start a collaborative crafting session. Other creators can join to craft together, share techniques, and learn from each other.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Room Title *</Label>
            <Input
              id="title"
              placeholder="e.g., Watercolor Techniques Workshop"
              {...form.register("title")}
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-600">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe what you'll be working on or teaching..."
              rows={3}
              {...form.register("description")}
            />
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="watercolor painting tutorial beginner"
              {...form.register("tags")}
            />
            <p className="text-xs text-slate-500">
              Separate tags with spaces to help others find your room
            </p>
          </div>

          {/* Max Participants */}
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Max Participants</Label>
            <Select
              value={form.watch("maxParticipants")?.toString()}
              onValueChange={(value) => form.setValue("maxParticipants", parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2, 4, 6, 8, 10, 12, 15, 20].map((num) => (
                  <SelectItem key={num} value={num.toString()}>
                    {num} participants
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Settings */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPublic"
                checked={form.watch("isPublic")}
                onCheckedChange={(checked) => form.setValue("isPublic", !!checked)}
              />
              <Label htmlFor="isPublic" className="text-sm">
                Public room (visible to everyone)
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="requiresApproval"
                checked={form.watch("requiresApproval")}
                onCheckedChange={(checked) => form.setValue("requiresApproval", !!checked)}
              />
              <Label htmlFor="requiresApproval" className="text-sm">
                Require approval to join
              </Label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Room"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
