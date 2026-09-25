import React, { useState, useRef, useCallback, useEffect } from 'react';
import Icon from '@/components/ui/AppIcon';
import { apiCall } from '@/services/apiservice';
import { message } from 'antd';

const API_BASE = (import.meta.env.VITE_BASE_API_URL || '').replace(/\/$/, '');

interface DocumentUploadFieldProps {
  value?: string;
  onChange?: (url: string) => void;
  uploading?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
  accept?: string;
}

interface FileTypeConfig {
  extension: string[];
  color: string;
  bgColor: string;
  icon: string;
  label: string;
}

const FILE_TYPE_CONFIGS: FileTypeConfig[] = [
  {
    extension: ['pdf'],
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: 'DocumentTextIcon',
    label: 'PDF',
  },
  {
    extension: ['doc', 'docx'],
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: 'DocumentIcon',
    label: 'Word',
  },
  {
    extension: ['xls', 'xlsx', 'csv'],
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: 'DocumentIcon',
    label: 'Excel',
  },
  {
    extension: ['ppt', 'pptx'],
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    icon: 'DocumentIcon',
    label: 'PowerPoint',
  },
  {
    extension: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    icon: 'PhotoIcon',
    label: 'Image',
  },
];

const DEFAULT_FILE_TYPE: FileTypeConfig = {
  extension: [],
  color: 'text-slate-600',
  bgColor: 'bg-slate-50',
  icon: 'DocumentIcon',
  label: 'File',
};

function getFileTypeConfig(fileName: string): FileTypeConfig {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  return FILE_TYPE_CONFIGS.find((config) => config.extension.includes(ext)) || DEFAULT_FILE_TYPE;
}

export default function DocumentUploadField({
  value,
  onChange,
  uploading = false,
  onUploadingChange,
  disabled = false,
  accept = 'application/pdf',
}: DocumentUploadFieldProps) {
  const [selectedFileName, setSelectedFileName] = useState('');
  const [fileName, setFileName] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  useEffect(() => {
    if (value && !fileName && !selectedFileName) {
      const parts = value.split('/');
      const nameFromUrl = parts[parts.length - 1];
      if (nameFromUrl) {
        setFileName(nameFromUrl);
      }
    }
  }, [value, fileName, selectedFileName]);

  const fileTypeConfig = fileName ? getFileTypeConfig(fileName) : null;

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  }, [API_BASE, onChange, onUploadingChange]);

  const uploadFile = useCallback(async (file: File) => {
    setSelectedFileName(file.name);
    setFileName(file.name);
    setUploadError('');
    const uploadFormData = new FormData();
    uploadFormData.append('Image', file);
    uploadFormData.append('UserId', '0');

    try {
      onUploadingChange?.(true);
      const uploadRes = await apiCall(`${API_BASE}/UploadFile`, {
        method: 'POST',
        body: uploadFormData,
      });

      if (!uploadRes.ok) throw new Error(`File upload failed: ${uploadRes.statusText}`);

      const uploadJson = await uploadRes.json();
      const basePath = uploadJson?.Data?.BasePath || '';

      if (uploadJson?.Success && basePath) {
        message.success('File uploaded successfully');
        onChange?.(basePath);
      } else {
        throw new Error(uploadJson?.Message || 'File upload failed');
      }
    } catch (err) {
      if (err instanceof Error) {
        message.error(err.message || 'Failed to upload document');
      }
      setSelectedFileName('');
      setFileName('');
      onChange?.('');
    } finally {
      onUploadingChange?.(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [API_BASE, onChange, onUploadingChange]);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounterRef.current = 0;

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFileName(file.name);
      setFileName(file.name);
      setUploadError('');
      uploadFile(file);
    }
  }, [disabled, uploading, uploadFile]);

  const handleRemove = useCallback(() => {
    setSelectedFileName('');
    setFileName('');
    setUploadError('');
    onChange?.('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onChange]);

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const displayFileName = fileName || selectedFileName;

  return (
    <div
      className="flex flex-col gap-2"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || uploading}
        className="hidden"
      />
      {displayFileName ? (
        <div className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-slate-50/50">
          <div className={`flex items-center justify-center w-9 h-9 rounded-md ${fileTypeConfig?.bgColor || 'bg-slate-100'}`}>
            <Icon
              name={fileTypeConfig?.icon || 'DocumentIcon'}
              size={20}
              className={`${fileTypeConfig?.color || 'text-slate-600'}`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-700 truncate">{displayFileName}</span>
              {fileTypeConfig && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${fileTypeConfig.bgColor} ${fileTypeConfig.color}`}>
                  {fileTypeConfig.label}
                </span>
              )}
            </div>
            {uploading && (
              <span className="text-xs text-slate-500">Uploading...</span>
            )}
          </div>
          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-700 transition-colors"
              title="Remove file"
            >
              <Icon name="XMarkIcon" size={16} />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleBrowseClick}
          disabled={disabled || uploading}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
            isDragOver
              ? 'border-purple-500 bg-purple-50 text-purple-700'
              : 'border-dashed border-slate-300 bg-slate-50/50 hover:border-purple-400 hover:bg-purple-50/50 text-slate-600 hover:text-purple-700'
          }`}
        >
          <Icon name="ArrowUpTrayIcon" size={18} className={isDragOver ? 'text-purple-500' : 'text-slate-400'} />
          <span className="font-medium">{uploading ? 'Uploading...' : isDragOver ? 'Drop file here' : 'Click to upload document'}</span>
        </button>
      )}
      {uploadError && (
        <span className="text-xs text-red-500">{uploadError}</span>
      )}
    </div>
  );
}

