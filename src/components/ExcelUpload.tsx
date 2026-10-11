"use client";

import React, { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import apiClient from "@/lib/api-client";
import axios from "axios";
import * as XLSX from "xlsx";
import { 
    Upload, 
    FileText, 
    X, 
    Loader2
} from "lucide-react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ExcelUploadProps {
    children?: React.ReactNode;
    uploadUrl: string;
    fileKey?: string;
    onSuccess?: (data: unknown) => void;
    onError?: (error: unknown) => void;
    title?: string;
    description?: string;
    templateHeaders?: string[];
    templateSampleData?: Record<string, unknown>[];
    templateFileName?: string;
}

export const ExcelUpload: React.FC<ExcelUploadProps> = ({
    children,
    uploadUrl,
    fileKey = "file",
    onSuccess,
    onError,
    title = "Bulk Upload",
    description = "Upload your excel file here. Only .xlsx, .xls and .csv files are supported.",
    templateHeaders,
    templateSampleData,
    templateFileName = "template.xlsx"
}) => {
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleDownloadTemplate = () => {
        if (!templateHeaders || !templateSampleData) return;

        try {
            const worksheet = XLSX.utils.json_to_sheet(templateSampleData, { header: templateHeaders });
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
            XLSX.writeFile(workbook, templateFileName);
            toast.success("Template downloaded successfully");
        } catch (error) {
            console.error("Error downloading template:", error);
            toast.error("Failed to download template");
        }
    };

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
            setProgress(0);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls'],
            'text/csv': ['.csv']
        },
        multiple: false
    });

    const handleUpload = async () => {
        if (!file) return;

        setUploading(true);
        const formData = new FormData();
        formData.append(fileKey, file);

        try {
            const response = await apiClient.post(uploadUrl, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / (progressEvent.total ?? 100));
                    setProgress(percentCompleted);
                },
            });

            queryClient.clear();
            toast.success("File uploaded successfully!");
            onSuccess?.(response);
            handleClose();
        } catch (error: unknown) {
            console.error("Upload error:", error);
            const errorMessage = axios.isAxiosError(error) 
                ? error.response?.data?.message 
                : (error instanceof Error ? error.message : "Failed to upload file");
            
            toast.error(errorMessage || "Failed to upload file");
            onError?.(error);
            setProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        setFile(null);
        setProgress(0);
        setUploading(false);
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setFile(null);
        setProgress(0);
    };

    return (
        <Dialog open={open} onOpenChange={(val) => {
            if (!uploading) {
                if (!val) handleClose();
                else setOpen(val);
            }
        }}>
            <DialogTrigger asChild>
                {children || <Button variant="outline"> <Upload className="mr-2 h-4 w-4" /> Bulk Upload</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] p-6 rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
                    <p className="text-sm text-neutral-500 mt-1">{description}</p>
                </DialogHeader>

                <div className="mt-6">
                    {templateHeaders && (
                        <div className="mb-6 p-4 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="bg-white p-2 rounded-lg shadow-sm">
                                    <FileText className="h-4 w-4 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-slate-700">Sample Template</p>
                                    <p className="text-[10px] text-slate-400">Download the required format</p>
                                </div>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-xs font-bold text-primary hover:bg-primary/5"
                                onClick={handleDownloadTemplate}
                            >
                                Download
                            </Button>
                        </div>
                    )}

                    {!file ? (
                        <div
                            {...(getRootProps() as React.HTMLAttributes<HTMLDivElement>)}
                            className={cn(
                                "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-all cursor-pointer",
                                isDragActive 
                                    ? "border-primary bg-primary/5 scale-[1.02]" 
                                    : "border-neutral-200 hover:border-primary/50 hover:bg-neutral-50"
                            )}
                        >
                            <input {...getInputProps()} />
                            <div className="bg-primary/10 p-4 rounded-full mb-4">
                                <Upload className="h-8 w-8 text-primary" />
                            </div>
                            <p className="text-base font-medium">Click to upload or drag and drop</p>
                            <p className="text-xs text-neutral-400 mt-1">Excel or CSV (max. 10MB)</p>
                        </div>
                    ) : (
                        <div className="border border-neutral-200 rounded-xl p-4 flex items-center justify-between bg-neutral-50">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <FileText className="h-6 w-6 text-green-600" />
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <p className="text-sm font-medium truncate max-w-[200px]">{file.name}</p>
                                    <p className="text-xs text-neutral-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                            </div>
                            {!uploading && (
                                <Button variant="ghost" size="icon" onClick={removeFile} className="h-8 w-8 rounded-full hover:bg-neutral-200">
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}

                    {uploading && (
                        <div className="mt-6 space-y-2">
                            <div className="flex justify-between items-center text-xs">
                                <span className="font-medium">Uploading...</span>
                                <span>{progress}%</span>
                            </div>
                            <Progress value={progress} className="h-2" />
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-3 mt-8">
                    <Button 
                        variant="ghost" 
                        onClick={handleClose} 
                        disabled={uploading}
                        className="rounded-lg"
                    >
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleUpload} 
                        disabled={!file || uploading}
                        className="rounded-lg px-8 bg-[#1e2330] hover:bg-[#1e2330]/90 text-white min-w-[120px]"
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting
                            </>
                        ) : (
                            "Upload File"
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};
