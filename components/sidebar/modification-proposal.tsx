"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Loader2 } from "lucide-react";
import { DocumentModificationResult } from "@/lib/agent-tool";

interface ModificationProposalProps {
  proposal: DocumentModificationResult;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function ModificationProposal({
  proposal,
  onApprove,
  onReject,
  isProcessing = false,
}: ModificationProposalProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // 마크다운 문법을 제거하고 순수 텍스트만 반환하는 함수
  const stripMarkdown = (text: string): string => {
    return (
      text
        // 헤더 제거 (# ## ### 등)
        .replace(/^#{1,6}\s+/gm, "")
        // 볼드 제거 (**text** 또는 __text__)
        .replace(/\*\*([^*]+)\*\*/g, "$1")
        .replace(/__([^_]+)__/g, "$1")
        // 이탤릭 제거 (*text* 또는 _text_)
        .replace(/\*([^*]+)\*/g, "$1")
        .replace(/_([^_]+)_/g, "$1")
        // 코드 블록 제거 (```code```)
        .replace(/```[\s\S]*?```/g, "")
        // 인라인 코드 제거 (`code`)
        .replace(/`([^`]+)`/g, "$1")
        // 링크 제거 ([text](url))
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        // 리스트 마커 제거 (- * +)
        .replace(/^[\s]*[-*+]\s+/gm, "• ")
        // 번호 리스트 마커 제거 (1. 2. 등)
        .replace(/^[\s]*\d+\.\s+/gm, "• ")
        // 인용 제거 (>)
        .replace(/^>\s+/gm, "")
        // 수평선 제거 (---, ***, ___)
        .replace(/^[\s]*[-*_]{3,}[\s]*$/gm, "")
        // 여러 줄바꿈을 두 줄바꿈으로 정리
        .replace(/\n{3,}/g, "\n\n")
        // 앞뒤 공백 제거
        .trim()
    );
  };

  if (!isClient) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* 모달 컨테이너 */}
      <div className="relative z-10 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl shadow-black/10">
          <CardHeader>
            <div className="flex items-center justify-center">
              <CardTitle className="text-lg font-medium text-gray-900">
                문서 수정 제안
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* 콘텐츠 비교 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                  원본
                </h4>
                <ScrollArea className="h-64 w-full">
                  <div className="text-sm text-gray-700 bg-white/40 backdrop-blur-sm p-4 rounded-lg border border-white/30 leading-relaxed">
                    {proposal.originalContent}
                  </div>
                </ScrollArea>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-800 flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  제안
                </h4>
                <ScrollArea className="h-64 w-full">
                  <div className="text-sm text-gray-700 bg-white/40 backdrop-blur-sm p-4 rounded-lg border border-white/30 leading-relaxed whitespace-pre-wrap">
                    {stripMarkdown(proposal.suggestedContent)}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-white/20">
              <Button
                onClick={onReject}
                disabled={isProcessing}
                variant="outline"
                className="flex-1 bg-white/60 hover:bg-white/70 text-gray-700 border border-white/30 backdrop-blur-sm"
              >
                <X className="h-4 w-4 mr-2" />
                거절하기
              </Button>
              <Button
                onClick={onApprove}
                disabled={isProcessing}
                className="flex-1 bg-white/80 hover:bg-white/90 text-gray-900 border border-white/30 backdrop-blur-sm shadow-sm"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                적용하기
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
