import { NextRequest, NextResponse } from "next/server";
import { getAiService } from "@/lib/anthropic";

export async function POST(request: NextRequest) {
  try {
    const { purpose, additionalInfo } = await request.json();

    if (!purpose || typeof purpose !== "string") {
      return NextResponse.json(
        { error: "문서 목적이 필요합니다." },
        { status: 400 }
      );
    }

    // 목적에 따른 한국어 이름 매핑
    const purposeNames: Record<string, string> = {
      report: "보고서",
      essay: "에세이",
      proposal: "기획서",
      article: "기사/블로그",
      academic: "학술 논문",
      creative: "창작물",
      other: "문서",
    };

    const purposeName = purposeNames[purpose] || purpose;

    // 목차 생성을 위한 프롬프트 구성 (영어로 토큰 절약)
    const prompt = `Create a clean, practical outline for a ${purposeName} document in Korean.

Document type: ${purposeName}
Additional info: ${additionalInfo || "None"}

Requirements:
1. Use simple, clear Korean titles without numbers or English translations
2. Structure: # (main sections), ## (subsections), ### (details)
3. 4-6 main sections with 2-3 relevant subsections each
4. Focus on essential, actionable content
5. Avoid redundant or overly academic sections
6. No introductory text, just the outline

Output clean markdown outline only.`;

    const aiService = getAiService();
    const outlineStream = aiService.chatStream(prompt);

    let outline = "";
    for await (const chunk of outlineStream) {
      outline += chunk;
    }

    // 목차 정리 및 검증
    const cleanOutline = outline.trim();

    if (!cleanOutline) {
      throw new Error("목차 생성에 실패했습니다.");
    }

    return NextResponse.json({
      outline: cleanOutline,
      purpose: purposeName,
      additionalInfo: additionalInfo || "",
    });
  } catch (error) {
    console.error("Error generating outline:", error);

    // 오류 발생 시 기본 목차 반환
    const defaultOutline = `# 서론
## 배경과 목적
## 주요 내용 개요

# 핵심 내용
## 첫 번째 주제
### 핵심 포인트
### 구체적 사례

## 두 번째 주제
### 핵심 포인트
### 구체적 사례

## 세 번째 주제
### 핵심 포인트
### 구체적 사례

# 결론
## 주요 내용 정리
## 향후 방향`;

    return NextResponse.json({
      outline: defaultOutline,
      purpose: "문서",
      additionalInfo: "",
    });
  }
}
