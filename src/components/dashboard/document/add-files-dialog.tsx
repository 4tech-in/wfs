"use client"

import * as React from "react"
import { useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { CloudUpload, Loader2, X, FileText, FileSpreadsheet, Plus } from "lucide-react"
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
import { useUpdateDocFilesMutation } from "@/hooks/queries/use-doc-center"

const formSchema = z.object({
  files: z.array(z.instanceof(File)).min(1, "At least one file is required"),
})

interface AddFilesDialogProps {
  documentId: string
  documentTitle: string
  trigger?: React.ReactNode
}

export function AddFilesDialog({ documentId, documentTitle, trigger }: AddFilesDialogProps) {
  const [open, setOpen] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const updateMutation = useUpdateDocFilesMutation()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      files: [],
    },
  })

  const selectedFiles = useWatch({ control: form.control, name: "files" }) || []

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await updateMutation.mutateAsync({
        documentId,
        files: values.files,
      })
      setOpen(false)
      form.reset()
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
          <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-500 hover:bg-emerald-50">
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Files</DialogTitle>
          <DialogDescription>
            Add more files to <strong>{documentTitle}</strong>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4 w-full">
            <FormField
              control={form.control}
              name="files"
              render={() => (
                <FormItem>
                  <FormLabel>Selected Files</FormLabel>
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
                        className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center cursor-pointer hover:border-emerald-500 transition-colors"
                      >
                        <CloudUpload className="mx-auto h-8 w-8 text-slate-400" />
                        <p className="mt-2 text-sm text-slate-500">
                          Click to select more files
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                          PDF, DOC, EXCEL, CSV, JPG, PNG (Max 5MB per file)
                        </p>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1 custom-scrollbar w-full">
                          {selectedFiles.map((file, index) => {
                            const isSpreadsheet = /\.(xlsx|xls|csv|xlsm|xlsb)$/i.test(file.name);
                            return (
                              <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200 w-full overflow-hidden">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  {isSpreadsheet ? (
                                    <FileSpreadsheet className="h-4 w-4 text-emerald-500 shrink-0" />
                                  ) : (
                                    <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
                                  )}
                                  <span className="text-xs font-medium truncate">
                                    {file.name}
                                  </span>
                                </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-slate-400 hover:text-rose-500"
                                onClick={() => removeFile(index)}
                              >
                                <X className="h-3 w-3" />
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
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                disabled={updateMutation.isPending || selectedFiles.length === 0}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  "Add Files"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
