"use client";

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  value?: string;
  onChange: (value: string | undefined) => void;
  label: string;
  className?: string;
}

function compressImage(file: File, maxWidth = 400, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        const compressed = canvas.toDataURL('image/png');
        resolve(compressed);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({ value, onChange, label, className }: ImageUploadProps) {
  const [isLoading, setIsLoading] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const compressed = await compressImage(file);
      onChange(compressed);
    } catch (error) {
      console.error('Error compressing image:', error);
      const reader = new FileReader();
      reader.onload = () => {
        onChange(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsLoading(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] },
    maxFiles: 1,
    maxSize: 5 * 1024 * 1024,
  });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(undefined);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <label className="text-sm font-medium text-slate-700">{label}</label>
      <div
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer overflow-hidden",
          isDragActive 
            ? "border-amber-500 bg-amber-50" 
            : value 
              ? "border-slate-200 bg-slate-50" 
              : "border-slate-300 bg-white hover:border-amber-400 hover:bg-amber-50/50"
        )}
      >
        <input {...getInputProps()} />
        {value ? (
          <div className="relative aspect-[3/2] w-full">
            <img 
              src={value} 
              alt={label} 
              className="w-full h-full object-contain p-2"
            />
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 px-4">
            {isLoading ? (
              <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mb-3">
                  {isDragActive ? (
                    <Upload className="w-6 h-6 text-amber-600" />
                  ) : (
                    <ImageIcon className="w-6 h-6 text-amber-600" />
                  )}
                </div>
                <p className="text-sm text-slate-600 text-center">
                  {isDragActive ? 'Drop image here' : 'Click or drag to upload'}
                </p>
                <p className="text-xs text-slate-400 mt-1">PNG, JPG up to 5MB</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
