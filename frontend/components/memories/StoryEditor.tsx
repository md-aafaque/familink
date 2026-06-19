"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import { cn } from '@/lib/cn';
import { useAppTheme } from '../providers/ThemeProvider';
import { useLanguage } from '../providers/LanguageProvider';
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon, 
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo,
  Link as LinkIcon
} from 'lucide-react';

interface StoryEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export default function StoryEditor({ content, onChange, placeholder }: StoryEditorProps) {
  const { theme } = useAppTheme();
  const { t } = useLanguage();

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder: placeholder || t('storyEditor.placeholder'),
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          class: 'text-primary underline cursor-pointer',
          target: '_blank',
          rel: 'noopener noreferrer',
        },
      }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-[200px] focus:outline-none p-4",
          "selection:bg-primary/30"
        ),
      },
    },
  });

  if (!editor) return null;

  const MenuButton = ({ 
    onClick, 
    active, 
    disabled, 
    children, 
    title 
  }: { 
    onClick: () => void; 
    active?: boolean; 
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "p-2 rounded-md transition-colors",
        active 
          ? "bg-primary text-primary-foreground" 
          : cn("hover:bg-slate-200 dark:hover:bg-slate-700", theme.colors.textMuted),
        disabled && "opacity-30 cursor-not-allowed"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn(
      "rounded-xl border overflow-hidden",
      theme.colors.border,
      theme.colors.bg
    )}>
      {/* Toolbar */}
      <div className={cn(
        "flex flex-wrap gap-1 p-1 border-b",
        theme.colors.border,
        theme.colors.surface
      )}>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title={t('storyEditor.bold')}
        >
          <Bold className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title={t('storyEditor.italic')}
        >
          <Italic className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor.isActive('underline')}
          title={t('storyEditor.underline')}
        >
          <UnderlineIcon className="w-4 h-4" />
        </MenuButton>
        
        <div className={cn("w-[1px] h-6 my-1 mx-1", theme.colors.border, "bg-slate-300 dark:bg-slate-700")} />

        <MenuButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title={t('storyEditor.bulletList')}
        >
          <List className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title={t('storyEditor.numberedList')}
        >
          <ListOrdered className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor.isActive('blockquote')}
          title={t('storyEditor.quote')}
        >
          <Quote className="w-4 h-4" />
        </MenuButton>

        <div className={cn("w-[1px] h-6 my-1 mx-1", theme.colors.border, "bg-slate-300 dark:bg-slate-700")} />

        <MenuButton
          onClick={() => {
            let url = window.prompt('URL');
            if (url) {
                // Prepend https:// if no protocol is present
                if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url)) {
                    url = 'https://' + url;
                }
                editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          active={editor.isActive('link')}
          title={t('storyEditor.addLink')}
        >
          <LinkIcon className="w-4 h-4" />
        </MenuButton>

        <div className="flex-1" />

        <MenuButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title={t('storyEditor.undo')}
        >
          <Undo className="w-4 h-4" />
        </MenuButton>
        <MenuButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title={t('storyEditor.redo')}
        >
          <Redo className="w-4 h-4" />
        </MenuButton>
      </div>

      {/* Editor Content */}
      <EditorContent editor={editor} />
      
      {/* Character Count/Footer */}
      <div className={cn(
        "px-4 py-2 border-t text-[10px] font-bold uppercase tracking-widest flex justify-between",
        theme.colors.border,
        theme.colors.textMuted
      )}>
        <span>{t('storyEditor.footerLabel')}</span>
        <span>{t('storyEditor.charCount').replace('{count}', String(editor.getText().length))}</span>
      </div>
    </div>
  );
}
