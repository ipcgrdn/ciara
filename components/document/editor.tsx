"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import Table from "@tiptap/extension-table";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TableRow from "@tiptap/extension-table-row";
import Image from "@tiptap/extension-image";
import ResizeImage from "tiptap-extension-resize-image";
import Underline from "@tiptap/extension-underline";
import FontFamily from "@tiptap/extension-font-family";
import TextStyle from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { FontSizeExtension } from "./extensions/font-size";
import { LineHeightExtension } from "./extensions/line-height";
import { Ruler } from "./ruler";
import { useLiveblocksExtension } from "@liveblocks/react-tiptap";
import { useEffect, useState } from "react";

import { useEditorStore } from "@/store/use-editor-store";
import { Threads } from "./threads";

export const Editor = () => {
  const { setEditor } = useEditorStore();
  const liveblocks = useLiveblocksExtension({
    // Liveblocks의 Y.Doc 인스턴스를 사용하여 문서 내용 저장
    field: "content",
  });

  // 마진 상태 관리
  const [leftMargin, setLeftMargin] = useState(56);
  const [rightMargin, setRightMargin] = useState(56);

  // 마진 변경 핸들러
  const handleMarginsChange = (
    newLeftMargin: number,
    newRightMargin: number
  ) => {
    setLeftMargin(newLeftMargin);
    setRightMargin(newRightMargin);

    // 에디터의 패딩을 실시간으로 업데이트
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      editorElement.style.paddingLeft = `${newLeftMargin}px`;
      editorElement.style.paddingRight = `${newRightMargin}px`;
    }
  };

  const editor = useEditor({
    immediatelyRender: false,
    onCreate({ editor }) {
      setEditor(editor);
    },
    onDestroy() {
      setEditor(null);
    },
    onUpdate({ editor }) {
      setEditor(editor);
      // Liveblocks가 자동으로 실시간 동기화를 처리하므로 수동 저장 제거
    },
    onSelectionUpdate({ editor }) {
      setEditor(editor);
    },
    onTransaction({ editor }) {
      setEditor(editor);
    },
    onFocus({ editor }) {
      setEditor(editor);
    },
    onBlur({ editor }) {
      setEditor(editor);
    },
    onContentError({ editor }) {
      setEditor(editor);
    },
    editorProps: {
      attributes: {
        style: `padding-left: ${leftMargin}px; padding-right: ${rightMargin}px;`,
        class:
          "focus:outline-none print:border-0 bg-white border border-[#c7c7c7] flex flex-col flex-col min-h-[1054px] w-[816px] pt-10 pr-10 pb-10 cursor-text",
      },
    },
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      TaskItem.configure({
        nested: true,
      }),
      TaskList,
      Table,
      TableCell,
      TableHeader,
      TableRow,
      Image,
      ResizeImage,
      Underline,
      FontFamily,
      TextStyle,
      Color,
      FontSizeExtension,
      LineHeightExtension,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      liveblocks,
    ],
  });

  // 에디터 생성 후 초기 패딩 설정
  useEffect(() => {
    if (editor) {
      const editorElement = editor.view.dom as HTMLElement;
      editorElement.style.paddingLeft = `${leftMargin}px`;
      editorElement.style.paddingRight = `${rightMargin}px`;
    }
  }, [editor]);

  // 컴포넌트 언마운트 시 정리 작업은 Liveblocks가 자동으로 처리

  return (
    <div className="size-full overflow-x-auto bg-[#f9fbfd] px-4 print:p-0 print:bg-white print:overflow-visible">
      <Ruler
        leftMargin={leftMargin}
        rightMargin={rightMargin}
        onMarginsChange={handleMarginsChange}
      />
      <div className="min-x-max flex justify-center w-[816px] py-4 print:py-0 mx-auto print:w-full print:min-w-0">
        <EditorContent editor={editor} />
        <Threads editor={editor} />
      </div>
    </div>
  );
};
