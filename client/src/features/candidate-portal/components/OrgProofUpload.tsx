'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, FileText, X, AlertCircle } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface OrgProofUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  error?: string;
}

const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png'];
const MAX_SIZE = 5 * 1024 * 1024;

export function OrgProofUpload({ value, onChange, error }: OrgProofUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const validateAndSetFile = (file: File) => {
    setUploadError(null);

    if (file.size > MAX_SIZE) {
      setUploadError('File is too large. Maximum size is 5MB.');
      onChange(null);
      return;
    }

    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadError('Invalid file type. Please upload PDF, JPG, JPEG, or PNG.');
      onChange(null);
      return;
    }

    onChange(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const clearFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-semibold text-black">Previous Organization Proof</label>
      <p className="text-xs text-muted-foreground -mt-1">Upload offer letter, salary slip, or experience certificate from your previous employer.</p>
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={cn(
          "relative flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all hover:bg-neutral-50/50",
          isDragActive ? "border-primary bg-primary/5" : "border-neutral-200",
          (error || uploadError) ? "border-destructive" : ""
        )}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange}
        />

        {value ? (
          <div className="flex w-full items-center justify-between bg-neutral-50 border rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2 text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-black max-w-[200px] truncate">{value.name}</p>
                <p className="text-xs text-muted-foreground">{(value.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <button
              onClick={clearFile}
              className="rounded-full p-1 text-muted-foreground hover:bg-neutral-100 hover:text-black transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-full bg-neutral-50 p-3 text-neutral-400">
              <UploadCloud className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-black">Click to upload or drag & drop</p>
              <p className="text-xs text-muted-foreground mt-0.5">PDF, JPG, JPEG, or PNG (Max 5MB)</p>
            </div>
          </div>
        )}
      </div>

      {(error || uploadError) && (
        <div className="flex items-center gap-1.5 text-xs text-red-500 mt-1">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>{uploadError || error}</span>
        </div>
      )}
    </div>
  );
}
