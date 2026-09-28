import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, Loader2, AlertCircle, Link2, Plus } from 'lucide-react';

export const ImageUploader = ({
  images = [],
  onUpload,
  onAddUrl,
  onDelete,
  maxFiles = 8,
  isLoading = false,
  label = 'Property Photos (Upload Files or Paste Image URLs)',
}) => {
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'url'
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    setError('');
    const validFiles = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validMimes.includes(file.type)) {
        setError(`Invalid format for '${file.name}'. Only JPEG, PNG, and WebP are supported.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError(`File '${file.name}' exceeds maximum 10MB limit.`);
        return;
      }
      validFiles.push(file);
    }

    if (images.length + validFiles.length > maxFiles) {
      setError(`You can upload at most ${maxFiles} images.`);
      return;
    }

    for (const file of validFiles) {
      if (onUpload) {
        await onUpload(file);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleAddUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    if (!urlInput.startsWith('http://') && !urlInput.startsWith('https://')) {
      setError('Please provide a valid URL starting with http:// or https://');
      return;
    }
    setError('');
    if (onAddUrl) {
      onAddUrl(urlInput.trim());
      setUrlInput('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block font-cinzel text-[9.5px] uppercase tracking-wider text-[#B88E43] font-bold">
          {label}
        </label>

        {/* Tab switch */}
        <div className="flex items-center bg-[#FAF6F0] p-0.5 rounded-[2px] border border-[#DFB76C]/30 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-3 py-1 rounded-[2px] font-cinzel text-[9px] uppercase tracking-wider font-semibold transition-all ${
              activeTab === 'upload'
                ? 'bg-[#13152C] text-[#DFB76C]'
                : 'text-[#13152C]/60 hover:text-[#13152C]'
            }`}
          >
            File Upload
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('url')}
            className={`px-3 py-1 rounded-[2px] font-cinzel text-[9px] uppercase tracking-wider font-semibold transition-all ${
              activeTab === 'url'
                ? 'bg-[#13152C] text-[#DFB76C]'
                : 'text-[#13152C]/60 hover:text-[#13152C]'
            }`}
          >
            Image Link / URL
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-[2px] bg-[#FDF2F2] border border-[#993A3A]/30 flex items-center gap-2 text-[#993A3A] text-xs font-sans">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {activeTab === 'upload' ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-[4px] p-8 text-center cursor-pointer transition-all duration-200 ${
            dragOver
              ? 'border-[#B88E43] bg-[#FAF6F0]'
              : 'border-[#DFB76C]/40 bg-[#FAF6F0]/60 hover:bg-[#FAF6F0] hover:border-[#B88E43]'
          }`}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => handleFiles(e.target.files)}
            multiple
            accept="image/jpeg,image/png,image/webp,image/jpg"
            className="hidden"
          />
          <div className="w-12 h-12 rounded-[2px] bg-[#FFFFFF] border border-[#DFB76C]/30 flex items-center justify-center mx-auto mb-3 text-[#B88E43]">
            {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6 stroke-[1.5]" />}
          </div>
          <p className="font-editorial text-base text-[#13152C]">
            Drag & drop high-resolution photographs, or <span className="text-[#B88E43] font-semibold underline underline-offset-2">browse files</span>
          </p>
          <p className="font-sans text-[11px] text-[#13152C]/50 mt-1">
            JPEG, PNG, or WebP up to 10MB each (max {maxFiles} images)
          </p>
        </div>
      ) : (
        <form onSubmit={handleAddUrl} className="flex gap-2">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#DFB76C]" />
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="Paste direct image URL (e.g. Unsplash https://...)"
              className="w-full pl-9 pr-3 py-2 luxury-input text-xs font-sans"
            />
          </div>
          <button
            type="submit"
            className="btn-luxury-primary text-xs whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Link</span>
          </button>
        </form>
      )}

      {/* Uploaded Thumbnails */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          {images.map((img, idx) => (
            <div
              key={img.public_id || idx}
              className="group relative rounded-[2px] overflow-hidden border border-[#DFB76C]/30 bg-[#FAF6F0] aspect-video"
            >
              <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onDelete) onDelete(img.public_id);
                }}
                className="absolute top-1.5 right-1.5 p-1 rounded-[2px] bg-[#0D0E20]/80 text-white hover:bg-[#993A3A] transition-colors"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              {idx === 0 && (
                <span className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-[2px] bg-[#13152C]/90 text-[8.5px] font-cinzel font-bold text-[#DFB76C] uppercase tracking-wider">
                  Primary Hero
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
