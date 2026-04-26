'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import FontSize from '@tiptap/extension-font-size';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinkExtension.configure({
        openOnClick: false,
      }),
      TextStyle,
      Color,
      Underline,
      FontSize.configure({
        types: ['textStyle'],
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[150px] px-4 py-3 border border-gray-300 rounded-lg',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-200 p-2 flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
          title="Allinea a sinistra"
        >
          ≡
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
          title="Centra"
        >
          ≡̲
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
          title="Allinea a destra"
        >
          ≡
        </button>

        <span className="border-l border-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`px-3 py-1 text-sm font-medium rounded ${editor.isActive('bold') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          B
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`px-3 py-1 text-sm font-medium rounded italic ${editor.isActive('italic') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          I
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`px-3 py-1 text-sm font-medium rounded underline ${editor.isActive('underline') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
        >
          U
        </button>

        <span className="border-l border-gray-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`px-3 py-1 text-sm rounded ${editor.isActive('bulletList') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
          title="Elenco puntato"
        >
          •
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`px-3 py-1 text-sm rounded ${editor.isActive('orderedList') ? 'bg-primary-100 text-primary-700' : 'text-gray-600 hover:bg-gray-200'}`}
          title="Elenco numerato"
        >
          1.
        </button>

        <span className="border-l border-gray-300 mx-1" />

        <select
          className="px-2 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100"
          onChange={(e) => {
            const size = e.target.value;
            if (size) {
              editor.chain().focus().setFontSize(size).run();
            }
          }}
          value={editor.getAttributes('textStyle').fontSize || ''}
        >
          <option value="">Size</option>
          <option value="12px">12px</option>
          <option value="14px">14px</option>
          <option value="16px">16px</option>
          <option value="18px">18px</option>
          <option value="20px">20px</option>
          <option value="24px">24px</option>
        </select>

        <div className="relative flex items-center">
          <span className="text-xs mr-1 text-gray-500">Col:</span>
          <input
            type="color"
            className="w-8 h-8 border border-gray-300 rounded cursor-pointer"
            onChange={(e) => {
              editor.chain().focus().setColor(e.target.value).run();
            }}
            value={editor.getAttributes('textStyle').color || '#000000'}
          />
        </div>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
