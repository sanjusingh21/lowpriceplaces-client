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
      const formData = new FormData();
      formData.append("file", file);
      if (folder) formData.append("folder", folder);

      cancelSourceRef.current = axios.CancelToken.source();

      // Upload directly to server using multipart/form-data
      const uploadRes = await axios.post(
        `${process.env.NEXT_PUBLIC_IMAGE_SERVER || "http://localhost:5000"}/api/media/upload`,
        formData,
        {
          headers: {
            ...headers,
            "Content-Type": "multipart/form-data"
          },
          cancelToken: cancelSourceRef.current.token,
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || file.size;
            const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
            setProgress(percentCompleted);
          }
        }
      );

      setLoading(false);
      return uploadRes.data; // Returns database Media record with local url
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
