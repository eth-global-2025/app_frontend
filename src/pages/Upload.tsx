import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { useAccount, useWalletClient } from "wagmi";
import { uploadEncryptedPdf, UploadResult } from "@/services/lighthouse";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "success" | "error";
  progress: number;
  lighthouseResult?: UploadResult;
}

export const UploadPage = () => {
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isCreatingAsset, setIsCreatingAsset] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]; // Only take the first file
      const newFile: UploadedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: "uploading",
        progress: 0,
      };

      setUploadedFile(newFile);

      // Simulate upload progress
      const interval = setInterval(() => {
        setUploadedFile((prev) => {
          if (!prev) return null;
          const newProgress = Math.min(prev.progress + 10, 100);
          return {
            ...prev,
            progress: newProgress,
            status: newProgress >= 90 ? "success" : "uploading",
          };
        });
        if (newFile.progress >= 90) {
          clearInterval(interval);
        }
      }, 200);
    }
  }, []);

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".svg"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false, // Only allow single file upload
  });

  const removeFile = () => {
    setUploadedFile(null);
  };

  const createAsset = async () => {
    if (!uploadedFile || !walletClient || !isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (uploadedFile.status !== "success") {
      toast.error("Please wait for the file to upload completely");
      return;
    }

    setIsCreatingAsset(true);
    
    try {
      toast.loading("Creating encrypted asset...", { id: "create-asset" });
      
      const result = await uploadEncryptedPdf({
        file: uploadedFile.file,
        signer: walletClient as any,
      });

      if (result && result.length > 0) {
        const uploadResult = result[0];
        setUploadedFile(prev => prev ? {
          ...prev,
          lighthouseResult: uploadResult
        } : null);

        toast.success("Asset created successfully!", { 
          id: "create-asset",
          description: `File uploaded to IPFS with CID: ${uploadResult.cid}` 
        });
      } else {
        throw new Error("No upload result received");
      }
    } catch (error) {
      console.error("Error creating asset:", error);
      toast.error("Failed to create asset. Please try again.", { 
        id: "create-asset",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    } finally {
      setIsCreatingAsset(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Upload Research Files
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Upload your research papers, datasets, and supporting documents
          </p>
        </div>

        {/* Upload Area */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200",
            isDragActive && !isDragReject
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : isDragReject
              ? "border-red-500 bg-red-50 dark:bg-red-900/20"
              : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500",
            "bg-white dark:bg-gray-800"
          )}
        >
          <input {...getInputProps()} />
          
          {!uploadedFile ? (
            // Upload prompt when no file is uploaded
            <div className="flex flex-col items-center space-y-4">
              <div
                className={cn(
                  "p-4 rounded-full",
                  isDragActive && !isDragReject
                    ? "bg-blue-100 dark:bg-blue-800"
                    : isDragReject
                    ? "bg-red-100 dark:bg-red-800"
                    : "bg-gray-100 dark:bg-gray-700"
                )}
              >
                <Upload
                  className={cn(
                    "w-8 h-8",
                    isDragActive && !isDragReject
                      ? "text-blue-600 dark:text-blue-400"
                      : isDragReject
                      ? "text-red-600 dark:text-red-400"
                      : "text-gray-600 dark:text-gray-400"
                  )}
                />
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isDragActive
                    ? isDragReject
                      ? "File type not supported"
                      : "Drop files here"
                    : "Drag & drop files here"}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  or{" "}
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    browse files
                  </span>
                </p>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Supports: PDF, DOC, DOCX, TXT, Images</p>
                <p>Max file size: 10MB</p>
              </div>
            </div>
          ) : (
            // File display when file is uploaded
            <div className="flex flex-col items-center space-y-4">
              <div className="p-4 rounded-full bg-green-100 dark:bg-green-800">
                <File className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {uploadedFile.file.name}
                </p>
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {formatFileSize(uploadedFile.file.size)}
                </p>
              </div>
              
              {/* Progress Bar */}
              {uploadedFile.status === "uploading" && (
                <div className="w-full max-w-xs">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadedFile.progress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Uploading... {uploadedFile.progress}%
                  </p>
                </div>
              )}

              {/* Status Messages */}
              {uploadedFile.status === "success" && (
                <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Upload Complete</span>
                </div>
              )}
              {uploadedFile.status === "error" && (
                <div className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm font-medium">Upload Failed</span>
                </div>
              )}

              <div className="text-sm text-gray-500 dark:text-gray-400">
                <p>Click to replace file or drag a new one</p>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {uploadedFile && uploadedFile.status === "success" && (
          <div className="mt-8 flex justify-end space-x-4">
            <button 
              onClick={removeFile}
              disabled={isCreatingAsset}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Remove File
            </button>
            <button 
              onClick={createAsset}
              disabled={isCreatingAsset || !isConnected}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isCreatingAsset ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating Asset...</span>
                </>
              ) : (
                <span>
                  {!isConnected ? "Connect Wallet to Create Asset" : "Create Asset"}
                </span>
              )}
            </button>
          </div>
        )}

        {/* Asset Created Success Message */}
        {uploadedFile?.lighthouseResult && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
            <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Asset Created Successfully!</span>
            </div>
            <div className="mt-2 text-sm text-green-700 dark:text-green-300">
              <p><strong>IPFS CID:</strong> {uploadedFile.lighthouseResult.cid}</p>
              <p><strong>File Name:</strong> {uploadedFile.lighthouseResult.name}</p>
              <p><strong>Size:</strong> {uploadedFile.lighthouseResult.size}</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
