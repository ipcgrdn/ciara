"use client";

import { ReactNode } from "react";
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
} from "@liveblocks/react/suspense";
import { useAuth } from "@/contexts/AuthContext";

interface RoomProps {
  roomId: string;
  children: ReactNode;
}

export function Room({ children, roomId }: RoomProps) {
  const { user } = useAuth();

  // 사용자가 로그인되지 않은 경우 로딩 표시
  if (!user) {
    return null;
  }

  return (
    <LiveblocksProvider
      authEndpoint={async (room) => {
        const response = await fetch(
          `/api/liveblocks-auth?userId=${user.id}&room=${room}`,
          {
            method: "POST",
          }
        );
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Authentication failed: ${errorText}`);
        }
        return await response.json();
      }}
      resolveUsers={async ({ userIds }) => {
        // 사용자 정보 반환 - userIds 배열에 해당하는 사용자들의 정보를 반환
        if (!userIds.includes(user.id)) return [];

        return [
          {
            name:
              user.user_metadata?.name ||
              user.user_metadata?.full_name ||
              user.email ||
              "익명 사용자",
            avatar:
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              "",
            email: user.email || "",
          },
        ];
      }}
      resolveMentionSuggestions={async ({ text }) => {
        // 멘션 기능을 위한 사용자 검색 (현재는 자기 자신만)
        const userName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email ||
          "익명 사용자";

        return text && userName.toLowerCase().includes(text.toLowerCase())
          ? [{ kind: "user" as const, id: user.id }]
          : [];
      }}
    >
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={<div className="h-full w-full" />}>
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  );
}
