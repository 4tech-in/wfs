"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { DocumentItem } from "@/types/doc-center"
import { FileText, FileSpreadsheet, Download, Trash, ExternalLink, Calendar } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"

interface ViewDocDialogProps {
  document: DocumentItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleteFile?: (fileUrl: string) => void
}

export function ViewDocDialog({ document: doc, open, onOpenChange, onDeleteFile }: ViewDocDialogProps) {
  const handleViewFile = (fileUrl: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""
    window.open(`${baseUrl}${fileUrl}`, "_blank")
  }

  const handleDownloadFile = (fileUrl: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || ""
    const fullUrl = `${baseUrl}${fileUrl}`
    const link = document.createElement("a")
    link.href = fullUrl
    const fileName = fileUrl.split("/").pop() || doc.title
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] rounded-[24px] border-none shadow-2xl p-0 overflow-hidden">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-black uppercase text-[10px] tracking-widest">
                  {doc.documentType}
                </Badge>
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(doc.createdAt), "PPP")}
                </span>
              </div>
              <DialogTitle className="text-white text-2xl font-black italic">{doc.title}</DialogTitle>
            </div>
            <div className="h-12 w-12 bg-white/5 rounded-2xl flex items-center justify-center">
              <FileText className="h-6 w-6 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white space-y-6">
          {doc.metadata && Object.keys(doc.metadata).length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Metadata</h4>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(doc.metadata)
                  .filter(([key]) => !["docKey", "renewalType"].includes(key))
                  .map(([key, value]) => {
                    let displayValue = String(value);
                    if ((key === "expiryDate" || key === "startDate") && value) {
                      try {
                        displayValue = format(new Date(value as string), "PPP");
                      } catch {
                        displayValue = String(value);
                      }
                    }

                    const labelMap: Record<string, string> = {
                      expiryDate: "Expiry Date",
                      description: "Description",
                      startDate: "Start Date",
                    };

                    const label = labelMap[key] || key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

                    return (
                      <div key={key} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">{label}</span>
                        <span className="text-sm font-bold text-slate-700">{displayValue}</span>
                      </div>
                    );
                })}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attached Files ({doc.files?.length || 0})</h4>
            </div>
            <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
              {doc.files?.map((file, idx) => {
                if (typeof file !== 'string') return null;
                const ext = file.split('.').pop()?.toLowerCase() || "";
                const isSpreadsheet = ["xlsx", "xls", "csv", "xlsm", "xlsb"].includes(ext);
                return (
                  <div key={idx} className="group flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="h-10 w-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm shrink-0">
                        {isSpreadsheet ? (
                          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <FileText className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-sm font-bold text-slate-700 truncate">
                          {file.split('/').pop() || "Unnamed File"}
                        </span>
                        <span className="text-[10px] font-black text-slate-400 uppercase">
                          {ext ? `${ext.toUpperCase()} File` : "File"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:text-emerald-600 hover:bg-white rounded-xl shadow-none"
                        onClick={() => handleViewFile(file)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl shadow-none"
                        onClick={() => handleDownloadFile(file)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      {onDeleteFile && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 text-slate-400 hover:text-rose-600 hover:bg-white rounded-xl shadow-none"
                          onClick={() => onDeleteFile(file)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!doc.files || doc.files.length === 0) && (
                <div className="text-center py-8 border-2 border-dashed border-slate-100 rounded-2xl">
                  <FileText className="h-8 w-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400 font-bold">No files attached to this document</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="font-bold text-slate-500 rounded-xl"
          >
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
