"use client";

import { cn } from "@/lib/utils";
import { ChatMessage } from "@/lib/chat-history";
import Image from "next/image";

interface MessagesProps {
  messages: ChatMessage[];
  isLoading?: boolean;
}

export const Messages = ({ messages, isLoading = false }: MessagesProps) => {
  if (messages.length === 0) {
    return (
      /* 메시지가 없을 때의 초기 상태 */
      <div className="h-full flex items-center justify-center">
        <Image
          src="/ciara.svg"
          alt="AI Sidebar"
          width={100}
          height={100}
          className="opacity-70"
        />
      </div>
    );
  }

  return (
    /* 메시지 목록 */
    <>
      <style>
        {`
          @keyframes scale-pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 0.7;
            }
            50% {
              transform: scale(1.5);
              opacity: 1;
            }
          }
        `}
      </style>
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              "flex",
              message.type === "user" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "max-w-full p-3 rounded-lg text-xs",
                message.type === "user"
                  ? "bg-gray-100 text-black"
                  : "text-slate-700"
              )}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
            </div>
          </div>
        ))}

        {/* 로딩 상태 표시 */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="text-slate-700 p-3 text-xs">
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 bg-slate-400 rounded-full"
                  style={{
                    animation: "scale-pulse 1.2s ease-in-out infinite",
                  }}
                />
                <span className="text-slate-500">Thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
