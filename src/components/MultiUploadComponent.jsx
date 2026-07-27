import React, { useState, useRef } from "react";
import axios from "axios";
import { getAuthToken } from "@/api";

export default function MultiUploadComponent({ folder, images, onImagesChange }) {
  const [uploadingFiles, setUploadingFiles] = useState([]); // Array of { id, name, progress, error, cancelToken }
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/svg+xml"];
  const API_BASE = process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000";

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

    if (e.dataTransfer.files) {
      const files = Array.from(e.dataTransfer.files);
      await startUploads(files);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      await startUploads(files);
    }
  };

  const startUploads = async (files) => {
    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        alert(`Unsupported file type: ${file.name}`);
        continue;
      }
      if (file.size > MAX_SIZE) {
        alert(`File exceeds 10MB limit: ${file.name}`);
        continue;
      }
      if (images.length + uploadingFiles.length >= 10) {
        alert("Maximum of 10 images allowed.");
        break;
      }

      const uploadId = Math.random().toString(36).substring(7);
      const cancelTokenSource = axios.CancelToken.source();

      // Add to uploading list
      setUploadingFiles((prev) => [
        ...prev,
        { id: uploadId, name: file.name, progress: 0, error: null, cancelTokenSource }
      ]);

      try {
        // 1. Get presigned PUT URL
        const presignedRes = await axios.post(
          `${API_BASE}/api/media/presigned-upload`,
          {
            folder,
            fileName: file.name,
            contentType: file.type
          },
          { headers }
        );

        const { uploadUrl, key } = presignedRes.data;

        // 2. Upload directly to S3
        await axios.put(uploadUrl, file, {
          headers: {
            "Content-Type": file.type
          },
          cancelToken: cancelTokenSource.token,
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || file.size;
            const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
            setUploadingFiles((prev) =>
              prev.map((item) =>
                item.id === uploadId ? { ...item, progress: percentCompleted } : item
              )
            );
          }
        });

        // 3. Confirm completion to backend
        const completeRes = await axios.post(
          `${API_BASE}/api/media/complete`,
          {
            key,
            type: file.type,
            size: file.size
          },
          { headers }
        );

        // Success! Remove from uploading list and add S3 url to images list
        setUploadingFiles((prev) => prev.filter((item) => item.id !== uploadId));
        
        // Add URL to images array
        const newImages = [...images, completeRes.data.url];
        onImagesChange(newImages);
      } catch (err) {
        if (axios.isCancel(err)) {
          setUploadingFiles((prev) => prev.filter((item) => item.id !== uploadId));
        } else {
          const errMsg = err.response?.data?.error || err.message || "Upload failed.";
          setUploadingFiles((prev) =>
            prev.map((item) =>
              item.id === uploadId ? { ...item, error: errMsg, progress: 0 } : item
            )
          );
        }
      }
    }
  };

  const handleCancel = (uploadId, cancelTokenSource) => {
    cancelTokenSource.cancel("Upload cancelled.");
    setUploadingFiles((prev) => prev.filter((item) => item.id !== uploadId));
  };

  const handleRemoveImage = (indexToRemove) => {
    const updated = images.filter((_, idx) => idx !== indexToRemove);
    onImagesChange(updated);
  };

  const handleMoveImage = (index, direction) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= images.length) return;
    
    const reordered = [...images];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;
    
    onImagesChange(reordered);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
      {/* Upload trigger zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        style={{
          height: "130px",
          border: dragActive ? "2px dashed var(--primary)" : "2px dashed var(--border-glass)",
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          background: dragActive ? "rgba(99, 102, 241, 0.05)" : "var(--bg-input)",
          transition: "all 0.2s ease",
          textAlign: "center",
          padding: "16px"
        }}
      >
        <span style={{ fontSize: "30px", marginBottom: "6px" }}>📸</span>
        <strong style={{ fontSize: "var(--font-body)", color: "var(--text-main)" }}>
          Drag & Drop Images Here
        </strong>
        <span style={{ fontSize: "var(--font-caption)", color: "var(--text-dim)", marginTop: "2px" }}>
          or click to browse (Max 10 images, JPEG, PNG, WEBP, Max 10MB each)
        </span>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </div>

      {/* Progressing uploads list */}
      {uploadingFiles.length > 0 && (
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "8px", background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)", padding: "12px", borderRadius: "8px" }}>
          <strong style={{ fontSize: "var(--font-caption)", color: "#10b981" }}>Uploading Files...</strong>
          {uploadingFiles.map((item) => (
            <div key={item.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
              <span style={{ fontSize: "11px", color: "var(--text-main)", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", flex: 1 }}>
                {item.name}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {item.error ? (
                  <span style={{ fontSize: "11px", color: "#ef4444" }}>⚠️ {item.error}</span>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "80px", height: "6px", background: "var(--bg-input)", borderRadius: "3px", overflow: "hidden", border: "1px solid var(--border-glass)" }}>
                      <div style={{ width: `${item.progress}%`, height: "100%", background: "linear-gradient(90deg, var(--primary), #ec4899)" }}></div>
                    </div>
                    <span style={{ fontSize: "11px", color: "#10b981", fontWeight: "bold" }}>{item.progress}%</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleCancel(item.id, item.cancelTokenSource)}
                  style={{ background: "none", border: "none", color: "#ef4444", fontSize: "11px", cursor: "pointer", fontWeight: "bold" }}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Uploaded images gallery (with reordering) */}
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "16px" }}>
          {images.map((url, idx) => (
            <div
              key={url + idx}
              className="glass-panel"
              style={{
                position: "relative",
                borderRadius: "10px",
                overflow: "hidden",
                border: "1px solid var(--border-glass)",
                display: "flex",
                flexDirection: "column",
                background: "var(--bg-card)"
              }}
            >
              {/* Image thumbnail */}
              <div style={{ height: "90px", width: "100%" }}>
                <img src={url} alt={`Gallery ${idx}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>

              {/* Action Toolbar */}
              <div style={{ display: "flex", borderTop: "1px solid var(--border-glass)", background: "rgba(255,255,255,0.02)", padding: "4px", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => handleMoveImage(idx, -1)}
                    style={{ padding: "2px 4px", fontSize: "10px", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)", border: "1px solid var(--border-glass)", borderRadius: "4px" }}
                    title="Move Left"
                  >
                    ◀
                  </button>
                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => handleMoveImage(idx, 1)}
                    style={{ padding: "2px 4px", fontSize: "10px", cursor: "pointer", background: "var(--bg-input)", color: "var(--text-main)", border: "1px solid var(--border-glass)", borderRadius: "4px" }}
                    title="Move Right"
                  >
                    ▶
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(idx)}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ef4444",
                    fontSize: "11px",
                    fontWeight: "bold",
                    cursor: "pointer",
                    padding: "2px 6px"
                  }}
                  title="Remove Image"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
