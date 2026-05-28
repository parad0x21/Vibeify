"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
  loading: () => <MarkdownSkeleton />,
});

export interface MarkdownEditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  height?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  height = 560,
}: MarkdownEditorProps) {
  return (
    <div data-color-mode="dark" className="vibeify-md-editor">
      <MDEditor
        value={value}
        onChange={(v) => onChange(v ?? "")}
        height={height}
        preview="edit"
        visibleDragbar={false}
        textareaProps={placeholder ? { placeholder } : undefined}
      />
    </div>
  );
}

function MarkdownSkeleton() {
  return <Skeleton className="h-[560px] rounded-[var(--radius-lg)]" />;
}
