import { useSocketStore } from "@/store/useSocketStore";
import { Avatar } from "@/components/ui";

export interface PresenceIndicatorProps {
  members: { user: { id: string; name: string } }[];
  currentUserId?: string;
}

/**
 * Shows a row of member avatars with live online/offline dots driven by
 * the Zustand presence store (updated by Socket.io presence:update events
 * from apps/realtime/handlers/presence.ts).
 */
export function PresenceIndicator({ members, currentUserId }: PresenceIndicatorProps) {
  const presence = useSocketStore((s) => s.presence);

  return (
    <div className="flex items-center gap-1.5">
      {members.map((m) => (
        <Avatar
          key={m.user.id}
          name={m.user.name}
          size="sm"
          online={m.user.id === currentUserId ? true : presence[m.user.id]}
        />
      ))}
    </div>
  );
}