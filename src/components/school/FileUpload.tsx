import React, { useState, useRef } from 'react';
import { Upload, File, X } from 'lucide-react';
import './FileUpload.css';

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
    <div className={`file-upload ${className}`}>
      <div
        className={`file-upload__dropzone ${isDragging ? 'file-upload__dropzone--active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <Upload size={32} className="file-upload__icon" />
        <p className="file-upload__text">Drag & drop files here or <span>browse</span></p>
        <p className="file-upload__hint">Max file size: {maxSize}MB</p>
        <input
          ref={inputRef}
          type="file"
          className="file-upload__input"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />
      </div>
      {files.length > 0 && (
        <div className="file-upload__list">
          {files.map((file, idx) => (
            <div key={idx} className="file-upload__item">
              <File size={16} />
              <span className="file-upload__name">{file.name}</span>
              <button className="file-upload__remove" onClick={() => removeFile(idx)}>
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
