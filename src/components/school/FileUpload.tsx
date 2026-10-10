import React, { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void;
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFilesSelected, accept, multiple = true, maxSize = 50, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    const newFiles = multiple ? [...files, ...dropped] : dropped;
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    const newFiles = multiple ? [...files, ...selected] : selected;
    setFiles(newFiles);
    onFilesSelected(newFiles);
  };

  const removeFile = (index: number) => {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    onFilesSelected(updated);
  };

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <div
        className={cn(
          "border-2 border-dashed border-[var(--gray-300)] rounded-[var(--radius-lg)] px-4 py-8 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 bg-white/50",
          "hover:border-[var(--primary-500)] hover:bg-indigo-600/[0.02]",
          isDragging && "border-[var(--primary-500)] bg-indigo-600/[0.04] scale-[1.005]",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={32} className="text-[var(--primary-500)]" />
        <p className="text-[0.813rem] text-[var(--gray-600)]">
          Drag & drop files here or <span className="text-[var(--primary-500)] font-semibold">browse</span>
        </p>
        <p className="text-[0.688rem] text-[var(--gray-400)]">Max file size: {maxSize}MB</p>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />
      </div>
      {files.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 px-2.5 py-[7px] bg-white border border-[var(--gray-200)] rounded-[7px] text-xs text-[var(--gray-700)]"
            >
              <File size={16} />
              <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">{file.name}</span>
              <button
                className="text-[var(--gray-400)] hover:text-red-500 flex items-center transition-colors duration-150"
                onClick={() => removeFile(idx)}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
