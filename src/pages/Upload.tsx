import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, File, X, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";
import { useAccount, useWalletClient } from "wagmi";
import { uploadEncryptedPdf, UploadResult } from "@/services/lighthouse";
import { useAddThesis } from "@/services/contractService";
import { generateFileDescription } from "@/services/AsiOne";
import { toast } from "sonner";
import { Navbar } from "@/components/Navbar";

interface UploadedFile {
  id: string;
  file: File;
  status: "uploading" | "success" | "error";
  progress: number;
  lighthouseResult?: UploadResult;
}

interface ThesisFormData {
  title: string;
  description: string;
  costInNative: string;
}

export const UploadPage = () => {
  const { theme } = useTheme();
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { addThesis, isPending: isAddingThesis, isConfirmed: isThesisConfirmed, isError: isThesisError, hash } = useAddThesis();
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isCreatingAsset, setIsCreatingAsset] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [thesisFormData, setThesisFormData] = useState<ThesisFormData>({
    title: "",
    description: "",
    costInNative: "0"
  });
  const [showThesisForm, setShowThesisForm] = useState(false);

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
    setShowThesisForm(false);
    setThesisFormData({
      title: "",
      description: "",
      costInNative: "0"
    });
  };

  const handleThesisSubmit = async () => {
    if (!uploadedFile?.lighthouseResult || !address) {
      toast.error("Missing required data");
      return;
    }

    if (!thesisFormData.title.trim() || !thesisFormData.description.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (thesisFormData.title.length > 100) {
      toast.error("Title must be 100 characters or less");
      return;
    }

    if (thesisFormData.description.length > 200) {
      toast.error("Description must be 200 characters or less");
      return;
    }

    try {
      // Generate a random hex salt for the thesis (32 bytes = 64 hex characters)
      const salt = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      
      toast.loading("Creating thesis on blockchain...", { id: "add-thesis" });
      
      await addThesis({
        salt,
        title: thesisFormData.title,
        cid: uploadedFile.lighthouseResult.cid,
        author: address,
        description: thesisFormData.description,
        costInNative: thesisFormData.costInNative
      });

      // The transaction has been submitted, toast will be updated when confirmed
    } catch (error) {
      console.error("Error adding thesis:", error);
      toast.error("Failed to create thesis on blockchain", { 
        id: "add-thesis",
        description: error instanceof Error ? error.message : "Unknown error"
      });
    }
  };

  // Handle blockchain transaction state changes
  React.useEffect(() => {
    if (isThesisConfirmed) {
      toast.success("Thesis created successfully on blockchain!", { 
        id: "add-thesis",
        description: `Transaction hash: ${hash?.slice(0, 10)}...` 
      });
      setShowThesisForm(false);
    } else if (isThesisError) {
      toast.error("Failed to create thesis on blockchain", { 
        id: "add-thesis",
        description: "Please try again" 
      });
    }
  }, [isThesisConfirmed, isThesisError, hash]);

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

        // Pre-fill title with filename (without extension)
        const fileName = uploadedFile.file.name;
        const titleWithoutExt = fileName.replace(/\.[^/.]+$/, "");
        setThesisFormData(prev => ({
          ...prev,
          title: titleWithoutExt
        }));

        setShowThesisForm(true);
        toast.success("File uploaded to IPFS successfully!", { 
          id: "create-asset",
          description: `CID: ${uploadResult.cid}. Generating description...` 
        });

        // Generate description using AI
        setIsGeneratingDescription(true);
        try {
          const generatedDescription = await generateFileDescription(uploadedFile.file);
          setThesisFormData(prev => ({
            ...prev,
            description: generatedDescription
          }));
          toast.success("Description generated successfully!", { 
            id: "description-generated",
            description: "AI-generated description based on file content" 
          });
        } catch (error) {
          console.error("Error generating description:", error);
          toast.error("Failed to generate description", { 
            id: "description-error",
            description: "Using fallback description" 
          });
          setThesisFormData(prev => ({
            ...prev,
            description: `Research document: ${titleWithoutExt}`
          }));
        } finally {
          setIsGeneratingDescription(false);
        }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
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
            "border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 backdrop-blur-md",
            isDragActive && !isDragReject
              ? "border-blue-500/50 bg-blue-500/20 dark:bg-blue-400/20"
              : isDragReject
              ? "border-red-500/50 bg-red-500/20 dark:bg-red-400/20"
              : "border-white/30 dark:border-gray-600/50 hover:border-blue-400/50 dark:hover:border-blue-500/50",
            "bg-white/80 dark:bg-gray-800/80 shadow-lg shadow-blue-500/10"
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
        {uploadedFile && uploadedFile.status === "success" && !uploadedFile.lighthouseResult && (
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

        {/* Thesis Form */}
        {showThesisForm && uploadedFile?.lighthouseResult && (
          <div className="mt-8 p-6 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md rounded-xl border border-white/20 dark:border-gray-700/50 shadow-xl shadow-blue-500/10">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Create Thesis on Blockchain
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={thesisFormData.title}
                  onChange={(e) => setThesisFormData(prev => ({ ...prev, title: e.target.value }))}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    thesisFormData.title.length > 100 
                      ? 'border-red-500 dark:border-red-500' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="Enter thesis title"
                  maxLength={100}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {thesisFormData.title.length > 100 ? 'Title too long' : 'Enter a descriptive title for your thesis'}
                  </p>
                  <span className={`text-xs ${
                    thesisFormData.title.length > 100 
                      ? 'text-red-500 dark:text-red-400' 
                      : thesisFormData.title.length > 80 
                        ? 'text-yellow-500 dark:text-yellow-400' 
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {thesisFormData.title.length}/100
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description * {isGeneratingDescription && (
                    <span className="text-blue-600 dark:text-blue-400 text-xs ml-2">
                      <Loader2 className="w-3 h-3 animate-spin inline mr-1" />
                      Generating...
                    </span>
                  )}
                </label>
                <textarea
                  value={thesisFormData.description}
                  onChange={() => {}} // Disabled - no user input allowed
                  className={`w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-600 text-gray-900 dark:text-white cursor-not-allowed ${
                    isGeneratingDescription 
                      ? 'border-blue-300 dark:border-blue-600' 
                      : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={isGeneratingDescription ? "Generating description from file content..." : "AI-generated description based on your file"}
                  rows={3}
                  readOnly
                  disabled
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {isGeneratingDescription 
                      ? 'AI is analyzing your file to generate an accurate description'
                      : 'Description is auto-generated from your file content to ensure accuracy'
                    }
                  </p>
                  <span className={`text-xs ${
                    thesisFormData.description.length > 200 
                      ? 'text-red-500 dark:text-red-400' 
                      : thesisFormData.description.length > 160 
                        ? 'text-yellow-500 dark:text-yellow-400' 
                        : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {thesisFormData.description.length}/200
                  </span>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Cost (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={thesisFormData.costInNative}
                  onChange={(e) => setThesisFormData(prev => ({ ...prev, costInNative: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.0"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Set to 0 for free access
                </p>
              </div>
              
              <div className="flex justify-end space-x-4 pt-4">
                <button 
                  onClick={removeFile}
                  disabled={isAddingThesis}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleThesisSubmit}
                  disabled={isAddingThesis || isGeneratingDescription || !isConnected || !thesisFormData.title.trim() || !thesisFormData.description.trim() || thesisFormData.title.length > 100 || thesisFormData.description.length > 200}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isAddingThesis ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating Thesis...</span>
                    </>
                  ) : isGeneratingDescription ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Generating Description...</span>
                    </>
                  ) : (
                    <span>
                      {!isConnected ? "Connect Wallet to Create Thesis" : "Create Thesis on Blockchain"}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Status Messages */}
        {uploadedFile?.lighthouseResult && (
          <div className="mt-6 space-y-4">
            {/* IPFS Upload Success */}
            <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">File Uploaded to IPFS Successfully!</span>
              </div>
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                <p><strong>IPFS CID:</strong> {uploadedFile.lighthouseResult.cid}</p>
                <p><strong>File Name:</strong> {uploadedFile.lighthouseResult.name}</p>
                <p><strong>Size:</strong> {uploadedFile.lighthouseResult.size}</p>
              </div>
            </div>

            {/* Blockchain Transaction Status */}
            {isAddingThesis && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <div className="flex items-center space-x-2 text-blue-800 dark:text-blue-200">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="font-medium">Creating Thesis on Blockchain...</span>
                </div>
                <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                  <p>Transaction submitted. Waiting for confirmation...</p>
                  {hash && <p><strong>Transaction Hash:</strong> {hash}</p>}
                </div>
              </div>
            )}

            {isThesisConfirmed && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center space-x-2 text-green-800 dark:text-green-200">
                  <CheckCircle className="w-5 h-5" />
                  <span className="font-medium">Thesis Created on Blockchain Successfully!</span>
                </div>
                <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                  <p><strong>Transaction Hash:</strong> {hash}</p>
                  <p>Your thesis is now available on the blockchain!</p>
                </div>
              </div>
            )}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};
