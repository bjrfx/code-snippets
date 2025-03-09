import { FC, useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { python } from '@codemirror/lang-python';
import { html } from '@codemirror/lang-html';
import { css } from '@codemirror/lang-css';
import { json } from '@codemirror/lang-json';
import { sql } from '@codemirror/lang-sql';
import { EditorState } from '@codemirror/state';

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
}

const languageMap: Record<string, any> = {
  javascript: javascript(),
  python: python(),
  html: html(),
  css: css(),
  json: json(),
  sql: sql(),
};

export const CodeEditor: FC<CodeEditorProps> = ({ 
  value, 
  language, 
  onChange,
  readOnly = false 
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView>();

  useEffect(() => {
    if (!editorRef.current) return;

    // Ensure the document has proper line breaks
    // This ensures CodeMirror recognizes multiple lines
    const normalizedValue = value || '';

    const state = EditorState.create({
      doc: normalizedValue,
      extensions: [
        basicSetup,
        languageMap[language] || javascript(),
        EditorState.readOnly.of(readOnly),
        EditorView.lineWrapping,
        EditorView.updateListener.of((update: any) => {
          if (update.docChanged) {
            onChange(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
    };
  }, [language, readOnly]);

  useEffect(() => {
    if (viewRef.current && value !== viewRef.current.state.doc.toString()) {
      viewRef.current.dispatch({
        changes: {
          from: 0,
          to: viewRef.current.state.doc.length,
          insert: value,
        },
      });
    }
  }, [value]);

  return <div ref={editorRef} className="h-full w-full" />;
};