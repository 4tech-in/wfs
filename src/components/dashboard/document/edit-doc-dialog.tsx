"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CloudUpload, Loader2, X, FileText, FileSpreadsheet, Pencil } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useUpdateDocMutation } from "@/hooks/queries/use-doc-center"
import { DocumentItem } from "@/types/doc-center"

const formSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  documentType: z.string().min(1, "Document type is required"),
  customDocumentType: z.string().optional(),
  files: z.array(z.instanceof(File)).optional(),
}).refine((data) => {
  const standardTypes = ["Bill", "Personal", "Picks", "Documents"];
  if (!standardTypes.includes(data.documentType) && (!data.customDocumentType || data.customDocumentType.trim() === "")) {
    return false;
  }
  return true;
}, {
  message: "Please specify the document type",
  path: ["customDocumentType"],
});

interface EditDocDialogProps {
  document: DocumentItem
  trigger?: React.ReactNode
}

export function EditDocDialog({ document: doc, trigger }: EditDocDialogProps) {
  const [open, setOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const updateMutation = useUpdateDocMutation()

  const standardTypes = ["Bill", "Personal", "Picks", "Documents"];
  const isCustomType = !standardTypes.includes(doc.documentType);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: doc.title,
      documentType: isCustomType ? "Other" : doc.documentType,
      customDocumentType: isCustomType ? doc.documentType : "",
      files: [],
    },
  })

  const docType = useWatch({ control: form.control, name: "documentType" })
  const selectedFiles = useWatch({ control: form.control, name: "files" }) || []

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateMutation.mutateAsync({
        id: doc._id,
        data: {
          title: values.title,
          documentType: values.documentType === "Other" ? values.customDocumentType! : values.documentType,
          files: values.files && values.files.length > 0 ? values.files : undefined,
        },
      })
      setOpen(false)
    } catch {
      // Error handled in mutation
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      const currentFiles = form.getValues("files") || []
      form.setValue("files", [...currentFiles, ...files])
    }
  }

  const removeFile = (index: number) => {
    const currentFiles = form.getValues("files") || []
    const updatedFiles = currentFiles.filter((_, i) => i !== index)
    form.setValue("files", updatedFiles)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full">
            <Pencil className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black italic">Edit Document</DialogTitle>
          <DialogDescription className="font-medium text-slate-500">
            Update document details or add more files.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Invoice #123" {...field} className="rounded-xl border-slate-200 focus:border-[#2eb88a] focus:ring-[#2eb88a]/20 h-11 font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="documentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Document Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-xl border-slate-200 focus:border-[#2eb88a] focus:ring-[#2eb88a]/20 h-11 font-bold">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                        <SelectItem value="Bill">Bill</SelectItem>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Picks">Picks</SelectItem>
                        <SelectItem value="Documents">Documents</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {docType === "Other" && (
              <FormField
                control={form.control}
                name="customDocumentType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Specify Type</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter document type" {...field} className="rounded-xl border-slate-200 focus:border-[#2eb88a] focus:ring-[#2eb88a]/20 h-11 font-bold" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="files"
              render={() => (
                <FormItem>
                  <FormLabel className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Add More Files (Optional)</FormLabel>
                  <FormControl>
                    <div className="space-y-3">
                      <Input
                        type="file"
                        className="hidden"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.csv,.xlsx,.xls,.xlsm,.xlsb,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
                        multiple
                      />
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-100 rounded-2xl p-6 text-center cursor-pointer hover:border-[#2eb88a] hover:bg-emerald-50/50 transition-all"
                      >
                        <CloudUpload className="mx-auto h-8 w-8 text-slate-300" />
                        <p className="mt-2 text-sm text-slate-500 font-bold">
                          Click to select additional files
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 uppercase font-black">
                          PDF, DOC, EXCEL, CSV, JPG, PNG (Max 5MB)
                        </p>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="grid grid-cols-1 gap-2 max-h-[120px] overflow-y-auto pr-1">
                          {selectedFiles.map((file, index) => {
                            const isSpreadsheet = /\.(xlsx|xls|csv|xlsm|xlsb)$/i.test(file.name);
                            return (
                              <div key={index} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3 overflow-hidden">
                                  <div className="h-8 w-8 bg-emerald-100 rounded-lg flex items-center justify-center shrink-0">
                                    {isSpreadsheet ? (
                                      <FileSpreadsheet className="h-4 w-4 text-[#2eb88a]" />
                                    ) : (
                                      <FileText className="h-4 w-4 text-[#2eb88a]" />
                                    )}
                                  </div>
                                  <span className="text-xs font-bold truncate text-slate-700">
                                    {file.name}
                                  </span>
                                </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={updateMutation.isPending}
                className="font-bold text-slate-500 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#2eb88a] hover:bg-[#259b74] rounded-xl font-black italic px-8 shadow-lg shadow-emerald-500/20 transition-all active:scale-95 text-white"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Update Document"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
