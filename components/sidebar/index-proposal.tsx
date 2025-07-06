"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Check, X, Loader2, List, Hash } from "lucide-react";
import { DocumentIndexResult } from "@/lib/agent-tool";

interface IndexProposalProps {
  indexResult: DocumentIndexResult;
  onApprove: () => void;
  onReject: () => void;
  isProcessing?: boolean;
}

export function IndexProposal({
  indexResult,
  onApprove,
  onReject,
  isProcessing = false,
}: IndexProposalProps) {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />

      {/* 모달 컨테이너 */}
      <div className="relative z-10 w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="bg-white/80 backdrop-blur-xl border-white/20 shadow-2xl shadow-black/10">
          <CardHeader>
            <div className="flex items-center justify-center gap-2">
              <List className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-lg font-medium text-gray-900">
                목차 생성
              </CardTitle>
            </div>
            <div className="text-center text-sm text-gray-600">
              {indexResult.indexItems.length}개 항목으로 구성된 목차가
              생성되었습니다
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* 목차 미리보기 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Hash className="h-4 w-4 text-blue-600" />
                목차 미리보기
              </div>

              <ScrollArea className="h-80 w-full">
                <div className="bg-white/40 backdrop-blur-sm p-4 rounded-lg border border-white/30">
                  <div className="space-y-2">
                    {indexResult.indexItems.map((item, idx) => (
                      <div
                        key={idx}
                        className={`flex items-start gap-3 p-2 rounded-md transition-colors hover:bg-white/30 ${
                          item.level === 1
                            ? "font-semibold text-gray-900 bg-blue-50/50"
                            : item.level === 2
                            ? "font-medium text-gray-800 ml-4 bg-blue-50/30"
                            : "text-gray-700 ml-8 bg-blue-50/20"
                        }`}
                      >
                        <span className="text-blue-600 font-mono text-xs mt-0.5 flex-shrink-0">
                          {"#".repeat(item.level)}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm">
                            {item.title}
                          </div>
                          {item.description && (
                            <div className="text-xs text-gray-600 mt-1 leading-relaxed">
                              {item.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollArea>
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
                거절
              </Button>
              <Button
                onClick={onApprove}
                disabled={isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isProcessing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Check className="h-4 w-4 mr-2" />
                )}
                승인
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
