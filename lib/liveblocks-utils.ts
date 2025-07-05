import { Liveblocks } from "@liveblocks/node";
import * as Y from "yjs";

// TipTap 노드 타입 정의
interface TipTapNode {
  type: string;
  text?: string;
  content?: TipTapNode[];
  attrs?: Record<string, unknown>;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

interface TipTapDocNode extends TipTapNode {
  type: "doc";
  content: TipTapNode[];
}

// Liveblocks 클라이언트 인스턴스
const liveblocks = new Liveblocks({
  secret: process.env.LIVEBLOCKS_SECRET_KEY!,
});

/**
 * AI 사용자 ID 생성
 * @param documentId - 문서 ID
 * @returns AI 사용자 ID
 */
export function createAIUserId(documentId: string): string {
  const aiUserId = `ai-assistant-${documentId}`;
  return aiUserId;
}

/**
 * AI 사용자로 Liveblocks Room에 연결
 * @param roomId - Room ID (문서 ID와 동일)
 * @returns Liveblocks Room 인스턴스
 */
export async function connectAIToRoom(roomId: string) {
  try {
    const aiUserId = createAIUserId(roomId);

    // AI 사용자로 Room 연결
    const room = liveblocks.getRoom(roomId);

    return { room, aiUserId };
  } catch (error) {
    throw new Error(`AI가 Room ${roomId}에 연결할 수 없습니다.`);
  }
}

/**
 * 새로운 방식: REST API를 사용한 Y.js 문서 읽기
 * @param roomId - Room ID
 * @returns 문서 내용 (텍스트 형태)
 */
export async function getDocumentContent(roomId: string): Promise<string> {
  try {
    // 새로운 방식: JSON 형태로 Y.js 문서 가져오기
    const apiUrl = `https://api.liveblocks.io/v2/rooms/${roomId}/ydoc?key=content`;

    const response = await fetch(apiUrl, {
      headers: {
        Authorization: `Bearer ${process.env.LIVEBLOCKS_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      return "";
    }

    const data = await response.json();

    // content 키의 데이터 추출
    if (data && data.content) {
      const extractedText = extractTextFromTipTapJson(data.content);
      return extractedText;
    }

    return "";
  } catch (error) {
    return "";
  }
}

/**
 * TipTap 데이터에서 텍스트 추출 (XML 형태만 처리)
 * @param content - TipTap XML 형태의 내용
 * @returns 추출된 텍스트
 */
function extractTextFromTipTapJson(
  content: string | TipTapDocNode | unknown
): string {
  if (!content) {
    return "";
  }

  // XML 문자열인 경우 (로그에서 확인된 형태)
  if (typeof content === "string") {
    return extractTextFromXmlString(content);
  }

  // TipTap의 기본 JSON 구조: { type: "doc", content: [...] }
  if (
    typeof content === "object" &&
    content !== null &&
    "type" in content &&
    "content" in content
  ) {
    const docNode = content as TipTapDocNode;
    if (docNode.type === "doc" && Array.isArray(docNode.content)) {
      const textParts: string[] = [];

      for (const node of docNode.content) {
        const nodeText = extractTextFromNode(node);
        if (nodeText.trim()) {
          textParts.push(nodeText);
        }
      }

      const result = textParts.join("\n");
      return result;
    }
  }

  // 기타 형태 처리
  return JSON.stringify(content);
}

/**
 * XML 문자열에서 텍스트 추출 및 줄바꿈 처리
 * @param xmlString - XML 형태의 문자열
 * @returns 추출된 텍스트 (줄바꿈 포함)
 */
function extractTextFromXmlString(xmlString: string): string {
  if (!xmlString || typeof xmlString !== "string") {
    return "";
  }

  // paragraph 태그를 기준으로 분할하여 줄바꿈 처리
  const paragraphRegex = /<paragraph[^>]*>(.*?)<\/paragraph>/g;
  const paragraphs: string[] = [];
  let match;

  while ((match = paragraphRegex.exec(xmlString)) !== null) {
    const content = match[1];

    if (content && content.trim()) {
      // 내부 HTML 태그 제거
      const cleanText = content.replace(/<[^>]*>/g, "").trim();
      if (cleanText) {
        paragraphs.push(cleanText);
      }
    }
  }

  // paragraph 태그가 없는 경우 전체 HTML 태그 제거
  if (paragraphs.length === 0) {
    const cleanText = xmlString.replace(/<[^>]*>/g, "").trim();
    return cleanText;
  }

  // 각 단락을 줄바꿈으로 연결
  const result = paragraphs.join("\n");
  return result;
}

/**
 * TipTap 노드에서 텍스트 추출
 * @param node - TipTap 노드
 * @returns 추출된 텍스트
 */
function extractTextFromNode(node: TipTapNode): string {
  if (!node) return "";

  // 텍스트 노드인 경우
  if (node.type === "text") {
    return node.text || "";
  }

  // 단락, 헤딩 등의 블록 노드인 경우
  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractTextFromNode).join("");
  }

  // 기타 노드 타입 처리
  return "";
}

/**
 * 마크다운을 TipTap Y.js 구조로 변환
 * @param markdown - 마크다운 텍스트
 * @returns Y.js XML 엘리먼트 배열
 */
function markdownToYjsElements(markdown: string): Y.XmlElement[] {
  const elements: Y.XmlElement[] = [];

  if (!markdown || markdown.trim() === "") {
    const emptyParagraph = new Y.XmlElement("paragraph");
    emptyParagraph.setAttribute("lineHeight", "normal");
    elements.push(emptyParagraph);
    return elements;
  }

  // 마크다운을 줄 단위로 분리
  const lines = markdown.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmedLine = line.trim();

    // 빈 줄 건너뛰기
    if (trimmedLine === "") {
      i++;
      continue;
    }

    // 제목 처리 (# ## ###)
    const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingText = headingMatch[2];
      const heading = new Y.XmlElement("heading");
      heading.setAttribute("level", level.toString());
      heading.setAttribute("lineHeight", "normal");
      
      const textNodes = parseInlineMarkdown(headingText);
      heading.insert(0, textNodes);
      elements.push(heading);
      i++;
      continue;
    }

    // 인용구 처리 (> 텍스트)
    if (trimmedLine.startsWith("> ")) {
      const quoteText = trimmedLine.substring(2);
      const blockquote = new Y.XmlElement("blockquote");
      blockquote.setAttribute("lineHeight", "normal");
      
      const paragraph = new Y.XmlElement("paragraph");
      paragraph.setAttribute("lineHeight", "normal");
      const textNodes = parseInlineMarkdown(quoteText);
      paragraph.insert(0, textNodes);
      blockquote.insert(0, [paragraph]);
      elements.push(blockquote);
      i++;
      continue;
    }

    // 순서 없는 목록 처리 (- 항목)
    if (trimmedLine.match(/^[-*+]\s+/)) {
      const listItems = [];
      while (i < lines.length && lines[i].trim().match(/^[-*+]\s+/)) {
        const itemText = lines[i].trim().substring(2);
        const listItem = new Y.XmlElement("listItem");
        listItem.setAttribute("lineHeight", "normal");
        
        const paragraph = new Y.XmlElement("paragraph");
        paragraph.setAttribute("lineHeight", "normal");
        const textNodes = parseInlineMarkdown(itemText);
        paragraph.insert(0, textNodes);
        listItem.insert(0, [paragraph]);
        listItems.push(listItem);
        i++;
      }
      
      const bulletList = new Y.XmlElement("bulletList");
      bulletList.setAttribute("lineHeight", "normal");
      bulletList.insert(0, listItems);
      elements.push(bulletList);
      continue;
    }

    // 순서 있는 목록 처리 (1. 항목)
    if (trimmedLine.match(/^\d+\.\s+/)) {
      const listItems = [];
      while (i < lines.length && lines[i].trim().match(/^\d+\.\s+/)) {
        const itemText = lines[i].trim().replace(/^\d+\.\s+/, '');
        const listItem = new Y.XmlElement("listItem");
        listItem.setAttribute("lineHeight", "normal");
        
        const paragraph = new Y.XmlElement("paragraph");
        paragraph.setAttribute("lineHeight", "normal");
        const textNodes = parseInlineMarkdown(itemText);
        paragraph.insert(0, textNodes);
        listItem.insert(0, [paragraph]);
        listItems.push(listItem);
        i++;
      }
      
      const orderedList = new Y.XmlElement("orderedList");
      orderedList.setAttribute("lineHeight", "normal");
      orderedList.setAttribute("start", "1");
      orderedList.insert(0, listItems);
      elements.push(orderedList);
      continue;
    }

    // 코드 블록 처리 (``` 코드 ```)
    if (trimmedLine.startsWith("```")) {
      const language = trimmedLine.substring(3).trim();
      i++; // 시작 ``` 라인 건너뛰기
      
      const codeLines = [];
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // 끝 ``` 라인 건너뛰기
      
      const codeBlock = new Y.XmlElement("codeBlock");
      codeBlock.setAttribute("lineHeight", "normal");
      if (language) {
        codeBlock.setAttribute("language", language);
      }
      
      const codeContent = codeLines.join('\n');
      if (codeContent) {
        codeBlock.insert(0, [new Y.XmlText(codeContent)]);
      }
      elements.push(codeBlock);
      continue;
    }

    // 일반 단락 처리
    const paragraph = new Y.XmlElement("paragraph");
    paragraph.setAttribute("lineHeight", "normal");
    const textNodes = parseInlineMarkdown(trimmedLine);
    paragraph.insert(0, textNodes);
    elements.push(paragraph);
    i++;
  }

  // 빈 elements 배열인 경우 빈 단락 추가
  if (elements.length === 0) {
    const emptyParagraph = new Y.XmlElement("paragraph");
    emptyParagraph.setAttribute("lineHeight", "normal");
    elements.push(emptyParagraph);
  }

  return elements;
}

/**
 * 인라인 마크다운 파싱 (굵게, 기울임, 코드 등)
 * @param text - 인라인 마크다운이 포함된 텍스트
 * @returns Y.js 텍스트 노드 배열
 */
function parseInlineMarkdown(text: string): (Y.XmlText | Y.XmlElement)[] {
  const nodes: (Y.XmlText | Y.XmlElement)[] = [];
  
  if (!text) {
    return [new Y.XmlText("")];
  }

  // 정규표현식으로 마크다운 패턴 찾기
  const patterns = [
    { regex: /\*\*(.+?)\*\*/g, type: 'bold' },           // **굵게**
    { regex: /\*(.+?)\*/g, type: 'italic' },             // *기울임*
    { regex: /_(.+?)_/g, type: 'italic' },               // _기울임_
    { regex: /`(.+?)`/g, type: 'code' },                 // `코드`
    { regex: /~~(.+?)~~/g, type: 'strike' },             // ~~취소선~~
  ];

  let lastIndex = 0;
  const matches: Array<{index: number, length: number, type: string, content: string}> = [];

  // 모든 패턴의 매치 찾기
  patterns.forEach(pattern => {
    let match;
    const regex = new RegExp(pattern.regex.source, 'g');
    while ((match = regex.exec(text)) !== null) {
      matches.push({
        index: match.index,
        length: match[0].length,
        type: pattern.type,
        content: match[1]
      });
    }
  });

  // 인덱스 순으로 정렬
  matches.sort((a, b) => a.index - b.index);

  // 겹치는 매치 제거 (첫 번째 우선)
  const validMatches = [];
  let lastEnd = 0;
  for (const match of matches) {
    if (match.index >= lastEnd) {
      validMatches.push(match);
      lastEnd = match.index + match.length;
    }
  }

  // 텍스트 노드 생성
  lastIndex = 0;
  for (const match of validMatches) {
    // 매치 이전의 일반 텍스트 추가
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        nodes.push(new Y.XmlText(plainText));
      }
    }

    // 스타일이 적용된 텍스트 추가
    const styledText = new Y.XmlText(match.content);
    
    switch (match.type) {
      case 'bold':
        styledText.format(0, match.content.length, { bold: true });
        break;
      case 'italic':
        styledText.format(0, match.content.length, { italic: true });
        break;
      case 'code':
        styledText.format(0, match.content.length, { code: true });
        break;
      case 'strike':
        styledText.format(0, match.content.length, { strike: true });
        break;
    }
    
    nodes.push(styledText);
    lastIndex = match.index + match.length;
  }

  // 마지막 일반 텍스트 추가
  if (lastIndex < text.length) {
    const remainingText = text.substring(lastIndex);
    if (remainingText) {
      nodes.push(new Y.XmlText(remainingText));
    }
  }

  // 노드가 없으면 빈 텍스트 반환
  if (nodes.length === 0) {
    return [new Y.XmlText(text)];
  }

  return nodes;
}

/**
 * 텍스트를 Y.js XML 엘리먼트로 직접 변환 (줄바꿈 처리 개선)
 * @param text - 변환할 텍스트 (줄바꿈 포함)
 * @returns Y.js XML 엘리먼트 배열
 */
function textToYjsElements(text: string): Y.XmlElement[] {
  const elements: Y.XmlElement[] = [];

  if (!text || text.trim() === "") {
    // 빈 단락 생성
    const emptyParagraph = new Y.XmlElement("paragraph");
    emptyParagraph.setAttribute("lineHeight", "normal");
    elements.push(emptyParagraph);
    return elements;
  }

  // HTML 태그 제거 (혹시 있을 경우)
  const cleanText = text.replace(/<[^>]*>/g, "");

  // 연속된 줄바꿈(\n\n)으로 단락 분할
  const paragraphs = cleanText.split(/\n\s*\n/);

  if (
    paragraphs.length === 0 ||
    (paragraphs.length === 1 && paragraphs[0].trim() === "")
  ) {
    const emptyParagraph = new Y.XmlElement("paragraph");
    emptyParagraph.setAttribute("lineHeight", "normal");
    elements.push(emptyParagraph);
  } else {
    paragraphs.forEach((paragraphText) => {
      const trimmedParagraph = paragraphText.trim();

      if (trimmedParagraph) {
        const paragraph = new Y.XmlElement("paragraph");
        paragraph.setAttribute("lineHeight", "normal");

        // 단락 내 단일 줄바꿈(\n)은 유지하되, TipTap에서는 하나의 텍스트로 처리
        const finalText = trimmedParagraph.replace(/\n/g, " ").trim();

        if (finalText) {
          paragraph.insert(0, [new Y.XmlText(finalText)]);
        }

        elements.push(paragraph);
      }
    });
  }

  // 빈 elements 배열인 경우 빈 단락 추가
  if (elements.length === 0) {
    const emptyParagraph = new Y.XmlElement("paragraph");
    emptyParagraph.setAttribute("lineHeight", "normal");
    elements.push(emptyParagraph);
  }

  return elements;
}

/**
 * 새로운 방식: 바이너리 업데이트를 사용한 문서 수정 (마크다운 지원)
 * @param roomId - Room ID
 * @param newContent - 새로운 문서 내용 (마크다운 형식 지원)
 * @param isMarkdown - 마크다운 형식 여부 (기본값: true)
 * @returns 수정 성공 여부
 */
export async function updateDocumentContent(
  roomId: string,
  newContent: string,
  isMarkdown: boolean = true
): Promise<boolean> {
  try {
    // 1. 기존 문서 상태를 바이너리로 가져오기
    const binaryUrl = `https://api.liveblocks.io/v2/rooms/${roomId}/ydoc-binary`;

    const binaryResponse = await fetch(binaryUrl, {
      headers: {
        Authorization: `Bearer ${process.env.LIVEBLOCKS_SECRET_KEY}`,
      },
    });

    // 2. Y.js 문서 생성 및 기존 상태 적용
    const yDoc = new Y.Doc();

    if (binaryResponse.ok) {
      const existingUpdate = new Uint8Array(await binaryResponse.arrayBuffer());
      Y.applyUpdate(yDoc, existingUpdate);
    }

    // 3. content 필드 업데이트
    const yXmlFragment = yDoc.getXmlFragment("content");

    // 기존 내용 삭제
    if (yXmlFragment.length > 0) {
      yXmlFragment.delete(0, yXmlFragment.length);
    }

    // 새 내용을 Y.js XML 구조로 변환하여 추가
    const xmlElements = isMarkdown 
      ? markdownToYjsElements(newContent) 
      : textToYjsElements(newContent);

    if (xmlElements.length > 0) {
      yXmlFragment.insert(0, xmlElements);
    }

    // 4. 바이너리 업데이트 생성 및 전송
    const update = Y.encodeStateAsUpdate(yDoc);

    const updateUrl = `https://api.liveblocks.io/v2/rooms/${roomId}/ydoc`;

    const updateResponse = await fetch(updateUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${process.env.LIVEBLOCKS_SECRET_KEY}`,
        "Content-Type": "application/octet-stream",
      },
      body: update,
    });

    if (!updateResponse.ok) {
      throw new Error(
        `업데이트 실패: ${updateResponse.status} ${updateResponse.statusText}`
      );
    }

    return true;
  } catch (error) {
    throw new Error(
      `AI가 문서 ${roomId}를 수정할 수 없습니다: ${
        error instanceof Error ? error.message : "알 수 없는 오류"
      }`
    );
  }
}
