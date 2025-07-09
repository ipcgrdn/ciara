import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { marked } from "marked";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 마크다운 텍스트를 HTML로 변환합니다.
 * Tiptap 에디터에서 사용할 수 있도록 적절한 HTML 형식으로 변환합니다.
 */
export async function markdownToHtml(markdown: string): Promise<string> {
  if (!markdown) return "";

  try {
    // marked를 사용하여 마크다운을 HTML로 변환
    const html = await marked.parse(markdown);
    return html;
  } catch (error) {
    console.error("마크다운 변환 중 오류:", error);
    // 오류 발생 시 기본 텍스트 반환
    return `<p>${markdown.replace(/\n/g, "<br>")}</p>`;
  }
}
