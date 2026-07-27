import { useState, useRef } from "react";
import axios from "axios";
import { getAuthToken } from "@/api";

export function useUploadFile() {
  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const cancelSourceRef = useRef(null);

  const uploadFile = async (file, folder) => {
    setLoading(true);
    setError(null);
    setProgress(0);

    const token = getAuthToken();
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      // 1. Get PUT presigned URL from backend
      const presignedRes = await axios.post(
        `${process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000"}/api/media/presigned-upload`,
        {
          folder,
          fileName: file.name,
          contentType: file.type
        },
        { headers }
      );

      const { uploadUrl, key, publicUrl } = presignedRes.data;

      // 2. Upload file directly to S3 using PUT presigned URL
      cancelSourceRef.current = axios.CancelToken.source();

      await axios.put(uploadUrl, file, {
        headers: {
          "Content-Type": file.type
        },
        cancelToken: cancelSourceRef.current.token,
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || file.size;
          const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
          setProgress(percentCompleted);
        }
      });

      // 3. Confirm completion to backend
      const completeRes = await axios.post(
        `${process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000"}/api/media/complete`,
        {
          key,
          type: file.type,
          size: file.size
        },
        { headers }
      );

      setLoading(false);
      return completeRes.data; // Returns database Media record
    } catch (err) {
      setLoading(false);
      if (axios.isCancel(err)) {
        setError("Upload cancelled.");
        throw new Error("Upload cancelled");
      } else {
        const errMsg = err.response?.data?.error || err.message || "Upload failed.";
        setError(errMsg);
        throw new Error(errMsg);
      }
    }
  };

  const cancelUpload = () => {
    if (cancelSourceRef.current) {
      cancelSourceRef.current.cancel("Upload cancelled.");
    }
  };

  return {
    uploadFile,
    cancelUpload,
    progress,
    loading,
    error,
    setProgress,
    setError
  };
}
