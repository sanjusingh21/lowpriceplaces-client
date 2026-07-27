import React, { useState, useRef } from "react";
import { useUploadFile } from "../hooks/useUploadFile";

export default function UploadComponent({ folder, onUploadSuccess, onUploadClear, initialImageUrl }) {
  const { uploadFile, cancelUpload, progress, loading, error, setProgress, setError } = useUploadFile();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialImageUrl || "");
  const fileInputRef = useRef(null);

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];

  const validateFile = (file) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Unsupported file type. Please upload a JPEG, PNG, WEBP, GIF, or SVG image.");
      return false;
    }
    if (file.size > MAX_SIZE) {
      setError("File exceeds 10MB limit.");
      return false;
    }
    return true;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      await startUpload(file);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await startUpload(file);
    }
  };

  const startUpload = async (file) => {
    setError(null);
    setProgress(0);
    
    if (!validateFile(file)) return;
    
    setSelectedFile(file);
    
    // Create local object URL for instant image preview
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);

    try {
      const media = await uploadFile(file, folder);
      if (onUploadSuccess) {
        onUploadSuccess(media);
      }
      // Update preview to use S3 URL once successfully completed
      setPreviewUrl(media.url);
    } catch (err) {
      console.error("Upload failed in component:", err);
    }
  };

  const handleRetry = async () => {
    if (selectedFile) {
      await startUpload(selectedFile);
    }
  };

  const handleCancel = () => {
    cancelUpload();
    setSelectedFile(null);
    setPreviewUrl(initialImageUrl || "");
    setProgress(0);
    if (onUploadClear) onUploadClear();
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setProgress(0);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (onUploadClear) onUploadClear();
  };

  return (
    <div className="glass-panel" style={{ padding: "20px", borderRadius: "16px", border: "1px solid var(--border-glass)", background: "var(--bg-card)", display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      <input
        ref={fileInputRef}
        type="file"
        style={{ display: "none" }}
        accept="image/*"
        onChange={handleFileChange}
        disabled={loading}
      />

      {!previewUrl && !loading && (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          style={{
            height: "160px",
            border: dragActive ? "2px dashed var(--primary)" : "2px dashed var(--border-glass)",
            borderRadius: "12px",
            background: dragActive ? "rgba(99, 102, 241, 0.05)" : "var(--bg-input)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.2s ease",
            textAlign: "center",
            padding: "16px"
          }}
        >
          <span style={{ fontSize: "36px", marginBottom: "8px" }}>📁</span>
          <span style={{ fontSize: "var(--font-body)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-main)" }}>
            Drag & Drop image here
          </span>
          <span style={{ fontSize: "var(--font-caption)", color: "var(--text-dim)", marginTop: "4px" }}>
            or click to browse from device (JPEG, PNG, WEBP, Max 10MB)
          </span>
        </div>
      )}

      {loading && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "160px", gap: "12px" }}>
          <div className="loading-spinner" style={{ width: "32px", height: "32px", border: "3px solid var(--border-glass)", borderTopColor: "var(--primary)", borderRadius: "50%", animation: "spin 1s linear infinite" }}></div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", width: "100%" }}>
            <span style={{ fontSize: "var(--font-small)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-main)" }}>
              Uploading image...
            </span>
            <div style={{ width: "80%", height: "8px", background: "var(--bg-input)", borderRadius: "4px", overflow: "hidden", position: "relative", border: "1px solid var(--border-glass)" }}>
              <div 
                style={{ 
                  width: `${progress}%`, 
                  height: "100%", 
                  background: "linear-gradient(90deg, var(--primary), #ec4899)", 
                  transition: "width 0.3s ease" 
                }} 
              />
            </div>
            <span style={{ fontSize: "var(--font-caption)", color: "var(--text-dim)" }}>
              {progress}% Uploaded
            </span>
          </div>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={handleCancel}
            style={{ padding: "6px 16px", borderRadius: "8px", fontSize: "12px" }}
          >
            Cancel Upload
          </button>
        </div>
      )}

      {previewUrl && !loading && (
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ width: "100px", height: "100px", borderRadius: "10px", overflow: "hidden", border: "1px solid var(--border-glass)", background: "rgba(255,255,255,0.02)" }}>
            <img 
              src={previewUrl} 
              alt="Media Preview" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", flex: 1, minWidth: "150px" }}>
            {selectedFile && (
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <span style={{ fontSize: "var(--font-small)", fontWeight: "var(--font-weight-semibold)", color: "var(--text-main)", wordBreak: "break-all", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 1, WebkitBoxOrient: "vertical" }}>
                  {selectedFile.name}
                </span>
                <span style={{ fontSize: "var(--font-caption)", color: "var(--text-dim)" }}>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            )}
            <div style={{ display: "flex", gap: "8px" }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleRemove}
                style={{ padding: "6px 12px", borderRadius: "8px", fontSize: "12px", background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.3)" }}
              >
                Delete File
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-panel" style={{ padding: "12px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "var(--font-caption)", color: "#f87171", fontWeight: "var(--font-weight-semibold)" }}>
            ⚠️ {error}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            {selectedFile && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleRetry}
                style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11px" }}
              >
                Retry
              </button>
            )}
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setError(null)}
              style={{ padding: "4px 8px", borderRadius: "6px", fontSize: "11px" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
