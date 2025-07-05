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
        const resolvedUsers = [];

        for (const userId of userIds) {
          if (userId.startsWith("ai-assistant-")) {
            // AI 사용자 정보 추가
            resolvedUsers.push({
              name: "Ciara",
              avatar: "🤖",
              email: "agent@ciara.app",
            });
          } else if (userId === user.id) {
            // 현재 로그인한 사용자 정보
            resolvedUsers.push({
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
            });
          }
          // 다른 사용자들의 경우 추후 확장 가능
        }

        return resolvedUsers;
      }}
      resolveMentionSuggestions={async ({ text }) => {
        // 멘션 기능을 위한 사용자 검색
        const suggestions = [];

        // 현재 사용자 추가
        const userName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email ||
          "익명 사용자";

        if (text && userName.toLowerCase().includes(text.toLowerCase())) {
          suggestions.push({ kind: "user" as const, id: user.id });
        }

        // AI 사용자 추가 (CIARA 또는 AI로 검색 시)
        if (
          text &&
          (text.toLowerCase().includes("ciara") ||
            text.toLowerCase().includes("ai") ||
            text.toLowerCase().includes("시아라"))
        ) {
          suggestions.push({
            kind: "user" as const,
            id: `ai-assistant-${roomId}`,
          });
        }

        return suggestions;
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
