// BlogBodyEditor.tsx — Tiptap rich-text editor for a blog section body.
// Replaces the old plain textarea + hand-rolled **bold**/"- " toolbar.
// Content round-trips as HTML; BlogPost.jsx renders it directly (sanitized)
// and falls back to the legacy plain-text parser for posts saved before this
// editor existed — see blogBody.js.
//
// Also reads/writes Word (.docx) files client-side (mammoth for import, docx
// for export — see docxConvert.ts), so a section drafted in Word can be
// brought in as-is, and the written section can be handed back as a .docx.

import { useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Mark } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import TiptapLink from '@tiptap/extension-link';
import TiptapImage from '@tiptap/extension-image';
import { TextStyle } from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import FontFamily from '@tiptap/extension-font-family';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { toast } from 'sonner';
import {
  Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, Quote, Undo2, Redo2,
  Heading2, Heading3, FileUp, FileDown, Loader2, Link as LinkIcon, Image as ImageIcon,
  Strikethrough, Code2, AlignLeft, AlignCenter, AlignRight, Highlighter, Palette,
  Check, X as XIcon,
} from 'lucide-react';
import type { BlogDocumentSettings, BlogReference } from '@/lib/api/blogAdmin';
import { legacyBodyToHtml } from '@/new-website/lib/blogBody';
import { docxFileToHtml, htmlToDocxBlob, downloadBlob } from './docxConvert';
import { uploadBlogCoverImage } from '@/lib/api/blogAdmin';

const RevisionMark = Mark.create({
  name: 'revision',
  addAttributes: () => ({
    type: { default: 'insertion' },
    author: { default: 'Blog Admin' },
  }),
  parseHTML: () => [{ tag: 'span[data-revision]' }],
  renderHTML: ({ HTMLAttributes }) => {
    const isDeletion = HTMLAttributes.type === 'deletion';
    return ['span', { ...HTMLAttributes, 'data-revision': HTMLAttributes.type, class: isDeletion ? 'revision-deletion' : 'revision-insertion' }, 0];
  },
});

function ToolbarButton({
  onClick, active, title, disabled, children,
}: {
  onClick: () => void; active?: boolean; title: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()} // keep editor selection while clicking
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-md border p-1.5 transition-colors disabled:opacity-50 ${
        active
          ? 'border-blue-300 bg-blue-100 text-blue-700 dark:border-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
          : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800'
      }`}
    >
      {children}
    </button>
  );
}

export default function BlogBodyEditor({
  value, onChange, placeholder, docxFilename, settings, onSettingsChange, references = [], onReferencesChange, onContentJsonChange,
}: {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  /** Base filename (no extension) used when exporting this section as .docx. */
  docxFilename?: string;
  settings?: BlogDocumentSettings;
  onSettingsChange?: (settings: BlogDocumentSettings) => void;
  references?: BlogReference[];
  onReferencesChange?: (references: BlogReference[]) => void;
  onContentJsonChange?: (json: Record<string, unknown>) => void;
}) {
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const docSettings: BlogDocumentSettings = {
    pageSize: 'A4', marginTop: 25, marginRight: 22, marginBottom: 25, marginLeft: 22,
    showPageNumbers: true, showTotalPages: true, fontFamily: 'Arial', fontSize: 11, ...settings,
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3, 4] } }),
      Underline,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: true }),
      RevisionMark,
      TiptapLink.configure({
        openOnClick: false,
        // Off by default — autolink's URL-like-text heuristic can misfire on
        // ordinary prose (e.g. a missing space after a period) and silently
        // turn a typo into a link. Pasting a URL or using the toolbar button
        // are the only ways to create one.
        autolink: false,
        linkOnPaste: true,
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      }),
      TiptapImage.configure({ allowBase64: true, HTMLAttributes: { loading: 'lazy', class: 'max-w-full rounded-lg' } }),
      Placeholder.configure({ placeholder: placeholder || 'Write the section body…' }),
    ],
    content: legacyBodyToHtml(value),
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
      onContentJsonChange?.(editor.getJSON() as unknown as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none min-h-[140px] px-2.5 py-2 text-sm text-slate-900 outline-none dark:text-white [&_p]:my-1.5 [&_ul]:my-1.5 [&_ol]:my-1.5 [&_.revision-insertion]:bg-emerald-100 [&_.revision-deletion]:bg-red-100 [&_.revision-deletion]:line-through',
      },
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // created once; the section swaps editors via React `key`, not prop sync

  if (!editor) return null;

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!editor.isEmpty && !window.confirm('Replace this section\'s current content with the Word document?')) return;
    setImporting(true);
    try {
      const html = await docxFileToHtml(file);
      editor.commands.setContent(html);
      onChange(editor.getHTML());
      toast.success('Word document imported');
    } catch (err) {
      console.error(err);
      toast.error('Could not read that Word document');
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await htmlToDocxBlob(editor.getHTML(), { settings: docSettings, references });
      downloadBlob(blob, `${(docxFilename || 'section').trim() || 'section'}.docx`);
    } catch (err) {
      console.error(err);
      toast.error('Could not export to Word');
    } finally {
      setExporting(false);
    }
  };

  const handleSetLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined;
    const url = window.prompt('Link URL', previousUrl || 'https://');
    if (url === null) return; // cancelled
    const trimmed = url.trim();
    if (!trimmed) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: trimmed }).run();
  };

  const handleImageClick = () => imageInputRef.current?.click();

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be 5 MB or smaller');
      return;
    }
    setUploadingImage(true);
    try {
      const { url } = await uploadBlogCoverImage(file);
      editor.chain().focus().setImage({ src: url, alt: '' }).run();
    } catch (err) {
      console.error(err);
      toast.error('Image upload failed');
    } finally {
      setUploadingImage(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700 dark:bg-slate-800">
      <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-700 dark:bg-slate-900">
        <select title="Font family" value={docSettings.fontFamily} onChange={(e) => { onSettingsChange?.({ ...docSettings, fontFamily: e.target.value }); editor.chain().focus().setFontFamily(e.target.value).run(); }} className="h-7 rounded border border-slate-200 bg-white px-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          {['Arial', 'Calibri', 'Georgia', 'Times New Roman', 'Verdana'].map((font) => <option key={font}>{font}</option>)}
        </select>
        <select title="Font size" value={docSettings.fontSize} onChange={(e) => { const size = Number(e.target.value); onSettingsChange?.({ ...docSettings, fontSize: size }); editor.chain().focus().setMark('textStyle', { fontSize: `${size}pt` }).run(); }} className="h-7 rounded border border-slate-200 bg-white px-1 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white">
          {[9, 10, 11, 12, 14, 16, 18, 24, 32].map((size) => <option key={size} value={size}>{size}</option>)}
        </select>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Align left"><AlignLeft className="h-3.5 w-3.5" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Align center"><AlignCenter className="h-3.5 w-3.5" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Align right"><AlignRight className="h-3.5 w-3.5" /></ToolbarButton>
        <label title="Text color" className="inline-flex h-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 px-1.5 text-slate-500 dark:border-slate-700"><Palette className="h-3.5 w-3.5" /><input type="color" className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0" onChange={(e) => editor.chain().focus().setColor(e.target.value).run()} /></label>
        <label title="Highlight color" className="inline-flex h-7 cursor-pointer items-center justify-center rounded-md border border-slate-200 px-1.5 text-slate-500 dark:border-slate-700"><Highlighter className="h-3.5 w-3.5" /><input type="color" defaultValue="#fff59d" className="h-4 w-4 cursor-pointer border-0 bg-transparent p-0" onChange={(e) => editor.chain().focus().toggleHighlight({ color: e.target.value }).run()} /></label>
        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Heading 2">
          <Heading2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Heading 3">
          <Heading3 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Bold">
          <Bold className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Italic">
          <Italic className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Underline">
          <UnderlineIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Strikethrough"><Strikethrough className="h-3.5 w-3.5" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} title="Inline code"><Code2 className="h-3.5 w-3.5" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive('codeBlock')} title="Code block"><Code2 className="h-3.5 w-3.5" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setMark('revision', { type: 'insertion' }).run()} title="Track insertion"><Check className="h-3.5 w-3.5 text-emerald-600" /></ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().setMark('revision', { type: 'deletion' }).run()} title="Track deletion"><XIcon className="h-3.5 w-3.5 text-red-600" /></ToolbarButton>
        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton onClick={handleSetLink} active={editor.isActive('link')} title="Link">
          <LinkIcon className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={handleImageClick} title="Insert image" disabled={uploadingImage}>
          {uploadingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Bullet list">
          <List className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Numbered list">
          <ListOrdered className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Quote">
          <Quote className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="Undo">
          <Undo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="Redo">
          <Redo2 className="h-3.5 w-3.5" />
        </ToolbarButton>
        <span className="mx-1 h-4 w-px bg-slate-200 dark:bg-slate-700" />
        <ToolbarButton onClick={handleImportClick} title="Import from Word (.docx)" disabled={importing}>
          {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileUp className="h-3.5 w-3.5" />}
        </ToolbarButton>
        <ToolbarButton onClick={handleExport} title="Export as Word (.docx)" disabled={exporting}>
          {exporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        </ToolbarButton>
        <input
          ref={fileInputRef}
          type="file"
          accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleImportFile}
        />
        <input
          ref={imageInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleImageFile}
        />
      </div>
      <div style={{ fontFamily: docSettings.fontFamily, fontSize: `${docSettings.fontSize}pt` }}>
        <EditorContent editor={editor} />
      </div>
      {onReferencesChange && <div className="border-t border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900"><div className="mb-1 text-[11px] font-bold text-slate-500">Footnotes and endnotes</div>{references.map((ref) => <div key={ref.id} className="mb-1 flex gap-1"><select value={ref.kind} onChange={(e) => onReferencesChange(references.map((r) => r.id === ref.id ? { ...r, kind: e.target.value as BlogReference['kind'] } : r))} className="rounded border text-[11px] dark:bg-slate-800"><option value="footnote">Footnote</option><option value="endnote">Endnote</option></select><input value={ref.text} onChange={(e) => onReferencesChange(references.map((r) => r.id === ref.id ? { ...r, text: e.target.value } : r))} className="min-w-0 flex-1 rounded border px-1 text-[11px] dark:bg-slate-800" /></div>)}<button type="button" className="text-[11px] font-bold text-blue-600" onClick={() => onReferencesChange([...references, { id: `ref-${Date.now()}`, kind: 'footnote', text: '' }])}>+ Add reference</button></div>}
    </div>
  );
}
