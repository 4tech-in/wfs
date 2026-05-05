"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Image from "next/image";
import { useForm, useFieldArray, useWatch, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RegisterEmployeeDto, EmergencyContact } from "@/types/employee";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, User, Upload, X, Loader2 } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { authStorage } from "@/lib/auth";
import { useAttendancePoliciesQuery } from "@/hooks/queries/use-attendance-policies";
import { usePayrollPoliciesQuery } from "@/hooks/queries/use-payroll-policies";
import { useCompanyQuery } from "@/hooks/queries/use-company";
import { useEmployeeIdDropdownQuery, useCreateEmployeeIdMutation } from "@/hooks/queries/use-employees-query";
import { AvailableEmployeeIdDialog } from "./available-employee-id-dialog";
import { useDepartmentsQuery, useDesignationsQuery } from "@/hooks/queries/use-org";
import { cn } from "@/lib/utils"

const emergencyContactSchema = z.object({
  name: z.string().optional(),
  relation: z.string().optional(),
  phone: z.string().optional(),
});

const familyMemberSchema = z.object({
  name: z.string().optional(),
  relation: z.string().optional(),
  age: z.coerce.number().optional(),
  _id: z.string().optional(),
});

const academicQualificationSchema = z.object({
  degree: z.string().optional(),
  institute: z.string().optional(),
  year: z.string().optional(),
  _id: z.string().optional(),
});

const workExperienceSchema = z.object({
  company: z.string().optional(),
  role: z.string().optional(),
  years: z.string().optional(),
  _id: z.string().optional(),
});

const documentSchema = z.object({
  title: z.string().optional(),
  url: z.string().optional(),
  file: z.any().optional(),
  _id: z.string().optional(),
});

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  profileImage: z.any().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  role: z.enum(["user", "hr", "admin"]),
  uniqueId: z.string().min(1, "Unique ID is required"),      // punch machine employeeId string (e.g. "Tech-001")
  employeeObjId: z.string().min(1, "Employee ID is required"), // _id of the selected employee-id record
  companyId: z.string().min(1, "Company is required"),
  attendancePolicyId: z.string().min(1, "Attendance policy is required"),
  payrollPolicyId: z.string().optional(),
  otherName: z.string().optional(),
  category: z.string().optional(),
  gender: z.enum(["male", "female", "other"]),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  maritalStatus: z.enum(["single", "married", "divorced", "widowed"]).optional(),
  familyDetails: z.array(familyMemberSchema).optional(),
  dob: z.string().optional(),
  bloodGroup: z.string().optional(),
  emergencyContact: emergencyContactSchema.optional(),
  reference: z.string().optional(),
  academicQualification: z.array(academicQualificationSchema).optional(),
  previousWorkExperience: z.array(workExperienceSchema).optional(),
  designationId: z.string().min(1, "Designation is required"),
  departmentId: z.string().min(1, "Department is required"),
  workingHours: z.string().optional(),
  aadharNo: z.string().optional(),
  pfNo: z.string().optional(),
  esiNo: z.string().optional(),
  doj: z.string().optional(),
  doe: z.string().optional().nullable(),
  permanentAddress: z.string().optional(),
  currentAddress: z.string().optional(),
  mobileNo: z.string().optional().or(z.literal("")),
  notes: z.string().optional(),
  documents: z.array(documentSchema).optional(),
  password: z.string().optional(),
  createdBy: z.string().optional(),
});

export type EmployeeFormValues = z.infer<typeof formSchema>;

interface EmployeeFormProps {
  initialValues?: Partial<RegisterEmployeeDto>;
  onSubmit: (data: RegisterEmployeeDto | FormData) => void;
  isLoading?: boolean;
  isEdit?: boolean;
}

export function EmployeeForm({
  initialValues,
  onSubmit,
  isLoading,
  isEdit = false,
}: EmployeeFormProps) {
  const user = authStorage.getUser();
  const { data: attendancePoliciesData } = useAttendancePoliciesQuery();
  const { data: payrollPoliciesData } = usePayrollPoliciesQuery();
  const { data: companyData } = useCompanyQuery({ limit: 100 });
  const { data: deptsData } = useDepartmentsQuery();
  const { data: desgsData } = useDesignationsQuery();

  // Helper to extract ID from potentially populated field
  const extractId = (val: unknown) => {
    if (!val) return "";
    if (typeof val === 'object' && val !== null && '_id' in val) {
      return (val as { _id: string })._id;
    }
    return String(val);
  };

  // Helper to format ISO date to yyyy-MM-dd
  const formatISOToDate = (isoString?: string) => {
    if (!isoString) return "";
    const date = parseISO(isoString);
    if (!isValid(date)) return "";
    return format(date, "yyyy-MM-dd");
  };

  const form = useForm<EmployeeFormValues>({
    resolver: zodResolver(formSchema) as Resolver<EmployeeFormValues>,
    defaultValues: {
      name: initialValues?.name || "",
      email: initialValues?.email || "",
      profileImage: initialValues?.profileImage || initialValues?.profilePicture || null,
      role: initialValues?.role || "user",
      uniqueId: initialValues?.uniqueId?.toString() || "",
      employeeObjId: extractId(initialValues?.employeeObjId),
      companyId: extractId(initialValues?.companyId),
      attendancePolicyId: extractId(initialValues?.attendancePolicyId),
      payrollPolicyId: extractId(initialValues?.payrollPolicyId),
      otherName: initialValues?.otherName || "",
      category: initialValues?.category || "",
      gender: (initialValues?.gender?.toLowerCase() as "male" | "female" | "other") || "male",
      fatherName: initialValues?.fatherName || "",
      motherName: initialValues?.motherName || "",
      maritalStatus: (initialValues?.maritalStatus?.toLowerCase() as "single" | "married" | "divorced" | "widowed") || "single",
      familyDetails: initialValues?.familyDetails || [],
      dob: formatISOToDate(initialValues?.dob),
      bloodGroup: initialValues?.bloodGroup || "",
      emergencyContact: {
        name: (initialValues?.emergencyContact as EmergencyContact)?.name || "",
        relation: (initialValues?.emergencyContact as EmergencyContact)?.relation || "",
        phone: (initialValues?.emergencyContact as EmergencyContact)?.phone || (typeof initialValues?.emergencyContact === 'string' ? initialValues?.emergencyContact : ""),
      },
      reference: initialValues?.reference || "",
      academicQualification: initialValues?.academicQualification?.length ? initialValues.academicQualification : [{ degree: "", institute: "", year: "" }],
      previousWorkExperience: initialValues?.previousWorkExperience || [],
      designationId: extractId(initialValues?.designationId || initialValues?.designation),
      departmentId: extractId(initialValues?.departmentId || initialValues?.department),
      workingHours: initialValues?.workingHours || "",
      aadharNo: initialValues?.aadharNo || "",
      pfNo: initialValues?.pfNo || "",
      esiNo: initialValues?.esiNo || "",
      doj: formatISOToDate(initialValues?.doj),
      permanentAddress: initialValues?.permanentAddress || "",
      currentAddress: initialValues?.currentAddress || "",
      mobileNo: initialValues?.mobileNo || "",
      notes: initialValues?.notes || "",
      documents: initialValues?.documents || [],
      password: "123456",
      createdBy: initialValues?.createdBy || user?.id || "",
    },
  });

  const companies = companyData?.data || [];
  const departments = deptsData?.data?.filter(d => d.isActive !== false) || [];
  const companyId = useWatch({ control: form.control, name: "companyId" });
  const departmentId = useWatch({ control: form.control, name: "departmentId" });

  const filteredDesignations = useMemo(() => {
    const designations = desgsData?.data?.filter(d => d.isActive !== false) || [];
    if (!departmentId) return [];
    return designations.filter(d => {
      const deptId = typeof d.departmentId === 'object' ? d.departmentId?._id : d.departmentId;
      return deptId === departmentId;
    });
  }, [desgsData, departmentId]);

  const selectedCompany = companies.find(c => c._id === companyId);
  const prefix = selectedCompany?.prefix;

  const { data: employeeIdData, isLoading: isLoadingIds } = useEmployeeIdDropdownQuery({ companyId, prefix });
  const { mutate: generateEmployeeId, isPending: isGeneratingId } = useCreateEmployeeIdMutation();
  const hasAutoGeneratedFor = useRef<string | null>(null);

  const prevCompanyIdRef = useRef<string | null>(null);

  // Auto-assign or generate Employee ID
  useEffect(() => {
    // Only proceed if we have a company selected
    if (!companyId || isGeneratingId) return;

    // Reset employeeObjId and uniqueId if company has changed since last run
    if (prevCompanyIdRef.current !== companyId) {
      if (prevCompanyIdRef.current !== null) {
        form.setValue("employeeObjId", "", { shouldValidate: true });
        form.setValue("uniqueId", "", { shouldValidate: true });
      }
      prevCompanyIdRef.current = companyId;
    }

    const currentEmployeeObjId = form.getValues("employeeObjId");

    // Case 1: We have available IDs and none is selected, auto-pick the first one
    if (employeeIdData?.data && employeeIdData.data.length > 0) {
      if (!currentEmployeeObjId) {
        const selectedIdRecord = employeeIdData.data[0];
        form.setValue("employeeObjId", selectedIdRecord._id, { 
          shouldValidate: true,
          shouldDirty: true 
        });

        // Also auto-fill uniqueId (Punch Machine No.) if it's empty by extracting numbers from employeeId string
        const currentUniqueId = form.getValues("uniqueId");
        if (!currentUniqueId) {
          const numericPart = selectedIdRecord.employeeId.match(/\d+/)?.[0];
          if (numericPart) {
            form.setValue("uniqueId", numericPart, { 
              shouldValidate: true,
              shouldDirty: true 
            });
          }
        }
      }
    } 
    // Case 2: No IDs available, none is selected, and we haven't already tried generating for this company
    else if (prefix && employeeIdData && employeeIdData.data.length === 0 && !currentEmployeeObjId && hasAutoGeneratedFor.current !== companyId) {
      hasAutoGeneratedFor.current = companyId;
      generateEmployeeId({ prefix, remark: "Auto-generated during registration" });
    }
  }, [employeeIdData, companyId, prefix, form, isEdit, isGeneratingId, generateEmployeeId]);

  const currentAddress = useWatch({ control: form.control, name: "currentAddress" });
  const [sameAsCurrent, setSameAsCurrent] = useState(false);

  useEffect(() => {
    if (sameAsCurrent) {
      form.setValue("permanentAddress", currentAddress, { shouldValidate: true });
    }
  }, [sameAsCurrent, currentAddress, form]);

  const { fields: academicFields, append: appendAcademic, remove: removeAcademic } = useFieldArray({ control: form.control, name: "academicQualification" });
  const { fields: experienceFields, append: appendExperience, remove: removeExperience } = useFieldArray({ control: form.control, name: "previousWorkExperience" });
  const { fields: familyFields, append: appendFamily, remove: removeFamily } = useFieldArray({ control: form.control, name: "familyDetails" });
  const { fields: documentFields, append: appendDocument, remove: removeDocument } = useFieldArray({ control: form.control, name: "documents" });

  const profileImage = useWatch({ control: form.control, name: "profileImage" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (profileImage instanceof File) {
      const url = URL.createObjectURL(profileImage);
      // Use queueMicrotask to avoid synchronous setState warning in some strict lint rules
      queueMicrotask(() => setPreviewUrl(url));
      return () => URL.revokeObjectURL(url);
    }
    queueMicrotask(() => setPreviewUrl(null));
  }, [profileImage]);

  const displayPreview = typeof profileImage === 'string' ? profileImage : previewUrl;

  const handleFormSubmit = (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();

    // 1. Handle top-level string/basic fields
    const basicFields = [
      'name', 'email', 'otherName', 'category', 'gender', 'fatherName',
      'motherName', 'maritalStatus', 'dob', 'bloodGroup', 'reference',
      'designationId', 'departmentId', 'workingHours', 'aadharNo', 'pfNo',
      'esiNo', 'doj', 'doe', 'permanentAddress', 'currentAddress', 'mobileNo',
      'notes', 'createdBy', 'attendancePolicyId', 'payrollPolicyId', 'companyId'
    ];

    basicFields.forEach(key => {
      const value = values[key as keyof EmployeeFormValues];
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value.toString());
      }
    });

    // 2. Special fields
    // Role - Hardcode to 'user' as per existing logic
    formData.append('role', 'user');

    // Unique ID (Punch Machine No.) - Send as stringified number
    if (values.uniqueId) {
      const num = parseInt(values.uniqueId.toString(), 10);
      if (!isNaN(num)) {
        formData.append('uniqueId', num.toString());
      }
    }

    // Employee Object ID (_id of the selected employee-id record)
    if (values.employeeObjId) {
      formData.append('employeeObjId', values.employeeObjId);
    }

    // 3. Complex Objects/Arrays
    // Emergency Contact fields mapping - using dot notation for backend compatibility
    if (values.emergencyContact && (values.emergencyContact.name || values.emergencyContact.relation || values.emergencyContact.phone)) {
      formData.append('emergencyContact.name', values.emergencyContact.name || '');
      formData.append('emergencyContact.relation', values.emergencyContact.relation || '');
      formData.append('emergencyContact.phone', values.emergencyContact.phone || '');
    }

    // Family details — individual indexed fields
    values.familyDetails?.forEach((member, i) => {
      formData.append(`familyDetails[${i}][name]`, member.name || '');
      formData.append(`familyDetails[${i}][relation]`, member.relation || '');
      formData.append(`familyDetails[${i}][age]`, (member.age ?? 0).toString());
    });

    // Academic qualification — individual indexed fields
    values.academicQualification?.forEach((qual, i) => {
      formData.append(`academicQualification[${i}][degree]`, qual.degree || '');
      formData.append(`academicQualification[${i}][institute]`, qual.institute || '');
      formData.append(`academicQualification[${i}][year]`, qual.year || '');
    });

    // Previous work experience — individual indexed fields
    values.previousWorkExperience?.forEach((exp, i) => {
      formData.append(`previousWorkExperience[${i}][company]`, exp.company || '');
      formData.append(`previousWorkExperience[${i}][role]`, exp.role || '');
      formData.append(`previousWorkExperience[${i}][years]`, exp.years || '');
    });

    // 4. Files
    // Profile image
    if (values.profileImage instanceof File) {
      formData.append('profileImage', values.profileImage);
    }

    // Other Documents: append each file + title pair separately
    if (values.documents && values.documents.length > 0) {
      values.documents.forEach((doc) => {
        if (doc.file instanceof File) {
          formData.append('otherDocuments', doc.file);
          formData.append('otherDocumentsTitle', doc.title || '');
        }
      });
    }

    onSubmit(formData);
  };

  const attendancePolicies = attendancePoliciesData?.policies || [];
  const payrollPolicies = (payrollPoliciesData as { data?: { _id: string; name: string }[] })?.data || [];

  // Memoize employee IDs to ensure the current employee's ID is included during edits
  const employeeIds = useMemo(() => {
    const list = [...(employeeIdData?.data || [])];
    if (isEdit && initialValues?.employeeObjId && typeof initialValues.employeeObjId === 'object') {
      const currentId = initialValues.employeeObjId as { _id: string; employeeId: string };
      const exists = list.some(item => item._id === currentId._id);
      if (!exists && currentId._id && currentId.employeeId) {
        // Satisfaction of the EmployeeDropdownItem type which requires more fields in some contexts
        list.unshift(currentId as typeof list[0]);
      }
    }
    return list;
  }, [employeeIdData?.data, isEdit, initialValues]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
        <ScrollArea className="h-[65vh] pr-4">
          <div className="space-y-8">

            {/* ── Section 1: Professional & Access ── */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider bg-slate-50 p-2 rounded">
                1. Professional & Access
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {companies.map((c) => (
                            <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employeeObjId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Employee ID *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            {isGeneratingId || (isLoadingIds && companyId) ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                                <span className="text-xs text-slate-400 font-medium">
                                  {isGeneratingId ? "Generating ID..." : "Fetching IDs..."}
                                </span>
                              </div>
                            ) : (
                              <SelectValue placeholder="Select employee ID" />
                            )}
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" className="mt-1">
                          {employeeIds.length > 0 ? (
                            employeeIds.map((emp) => (
                              <SelectItem key={emp._id} value={emp._id}>
                                {emp.employeeId}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectGroup>
                              <SelectLabel className="text-center py-4 px-2">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
                                  No available IDs<br />for this company
                                </p>
                              </SelectLabel>
                              <div className="px-2 pb-2" onPointerDown={(e) => e.stopPropagation()}>
                                <AvailableEmployeeIdDialog
                                  triggerLabel="Create Employee ID"
                                  triggerClassName="w-full bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                                />
                              </div>
                            </SelectGroup>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="uniqueId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Unique ID (Punch Machine No.) *</FormLabel>
                      <FormControl><Input type="number" placeholder="e.g. 1001" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Department *</FormLabel>
                      <Select 
                        onValueChange={(val) => {
                          field.onChange(val);
                          form.setValue("designationId", "");
                        }} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="designationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Designation *</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                        disabled={!departmentId}
                      >
                        <FormControl>
                          <SelectTrigger className={cn(!departmentId && "opacity-50 cursor-not-allowed")}>
                            <SelectValue placeholder={departmentId ? "Select designation" : "Select department first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent position="popper" sideOffset={4} className="z-[100]">
                          {!departmentId ? (
                            <div className="py-6 px-2 text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                                Please select a<br />department first
                              </p>
                            </div>
                          ) : filteredDesignations.length === 0 ? (
                            <div className="py-6 px-2 text-center">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-loose">
                                No designations found<br />for this department
                              </p>
                            </div>
                          ) : (
                            filteredDesignations.map((d) => (
                              <SelectItem key={d._id} value={d._id}>{d.name}</SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="doj"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>D.O.J (Joining)</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ""} 
                          className="h-9 rounded-lg border-input bg-background/50 hover:bg-white transition-colors focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="attendancePolicyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Attendance Policy *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {attendancePolicies.map((p) => (
                            <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="payrollPolicyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payroll Policy</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Select policy" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {payrollPolicies.map((p) => (
                            <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl><Input placeholder="john@example.com" {...field} disabled={isEdit} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* ── Section 2: Personal Details ── */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider bg-slate-50 p-2 rounded">
                2. Personal Details
              </h3>

              {/* Profile Picture */}
              <div className="flex flex-col items-center justify-center space-y-3 mb-4">
                <FormField
                  control={form.control}
                  name="profileImage"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem className="flex flex-col items-center">
                      <FormControl>
                        <div className="relative group cursor-pointer">
                          <div className="w-24 h-24 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-50 group-hover:border-primary transition-all duration-200 shadow-sm">
                            {displayPreview ? (
                              <Image src={displayPreview} alt="Profile Preview" width={96} height={96} className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center text-slate-400 group-hover:text-primary transition-colors">
                                <User className="w-8 h-8 mb-1" />
                                <span className="text-[10px] font-medium">Upload</span>
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <Upload className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png"
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            style={{ fontSize: 0 }}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) return;
                              onChange(file);
                            }}
                            name={fieldProps.name}
                            onBlur={fieldProps.onBlur}
                            ref={fieldProps.ref}
                          />
                          {value && (
                            <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange(null); }} className="absolute -top-1 -right-1 bg-rose-500 text-white rounded-full p-1 shadow-lg hover:bg-rose-600 transition-colors z-10">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </FormControl>
                      <FormLabel className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-tight">Profile Photo</FormLabel>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="otherName" render={({ field }) => (<FormItem><FormLabel>Other Name</FormLabel><FormControl><Input placeholder="Alias" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          value={field.value || ""} 
                          className="h-9 rounded-lg border-input bg-background/50 hover:bg-white transition-colors focus:bg-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField control={form.control} name="bloodGroup" render={({ field }) => (<FormItem><FormLabel>Blood Group</FormLabel><FormControl><Input placeholder="O+" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField
                  control={form.control}
                  name="maritalStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Marital Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="single">Single</SelectItem>
                          <SelectItem value="married">Married</SelectItem>
                          <SelectItem value="divorced">Divorced</SelectItem>
                          <SelectItem value="widowed">Widowed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* ── Section 3: Family & Contact ── */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider bg-slate-50 p-2 rounded">
                3. Family & Contact
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="fatherName" render={({ field }) => (<FormItem><FormLabel>Father&apos;s Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="motherName" render={({ field }) => (<FormItem><FormLabel>Mother&apos;s Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="mobileNo" render={({ field }) => (<FormItem><FormLabel>Mobile No</FormLabel><FormControl><Input placeholder="9876543210" {...field} maxLength={10} /></FormControl><FormMessage /></FormItem>)} />
                <div className="col-span-2 grid grid-cols-3 gap-4 p-4 border rounded-xl bg-rose-50/20">
                  <FormField
                    control={form.control}
                    name="emergencyContact.name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Emergency Contact Name</FormLabel>
                        <FormControl><Input placeholder="Name" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContact.relation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relation</FormLabel>
                        <FormControl><Input placeholder="Relation" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="emergencyContact.phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl><Input placeholder="Phone" {...field} maxLength={10} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Family Members */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Family Members</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendFamily({ name: "", relation: "", age: 0 })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Member
                  </Button>
                </div>
                {familyFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-3 gap-4 p-4 border rounded-xl relative bg-slate-50/50">
                    <FormField control={form.control} name={`familyDetails.${index}.name`} render={({ field }) => (<FormItem><FormLabel className="text-[10px]">Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`familyDetails.${index}.relation`} render={({ field }) => (<FormItem><FormLabel className="text-[10px]">Relation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="flex gap-2 items-end">
                      <FormField control={form.control} name={`familyDetails.${index}.age`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-[10px]">Age</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => removeFamily(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>

              <FormField control={form.control} name="reference" render={({ field }) => (<FormItem><FormLabel>Reference (If any)</FormLabel><FormControl><Input placeholder="Referred by..." {...field} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="currentAddress" render={({ field }) => (<FormItem><FormLabel>Current Address</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
              <div className="flex items-center space-x-2 my-2">
                <Checkbox id="same-as-current" checked={sameAsCurrent} onCheckedChange={(checked) => setSameAsCurrent(!!checked)} />
                <Label htmlFor="same-as-current" className="text-xs text-slate-500 font-medium cursor-pointer">Same as current address</Label>
              </div>
              <FormField control={form.control} name="permanentAddress" render={({ field }) => (<FormItem><FormLabel>Permanent Address</FormLabel><FormControl><Input {...field} disabled={sameAsCurrent} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <Separator />

            {/* ── Section 4: Documentation & Qualification ── */}
            <div className="space-y-4 pb-4">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider bg-slate-50 p-2 rounded">
                4. Documentation & Qualification
              </h3>

              {/* Academic Qualifications */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Academic Qualifications</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendAcademic({ degree: "", institute: "", year: "" })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Qualification
                  </Button>
                </div>
                {academicFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-3 gap-4 p-4 border rounded-xl bg-amber-50/20">
                    <FormField control={form.control} name={`academicQualification.${index}.degree`} render={({ field }) => (<FormItem><FormLabel className="text-[10px]">Degree</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`academicQualification.${index}.institute`} render={({ field }) => (<FormItem><FormLabel className="text-[10px]">Institute</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="flex gap-2 items-end">
                      <FormField control={form.control} name={`academicQualification.${index}.year`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-[10px]">Year</FormLabel><FormControl><Input placeholder="2020" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => removeAcademic(index)} disabled={academicFields.length === 1}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Work Experience */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Previous Work Experience</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendExperience({ company: "", role: "", years: "" })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Experience
                  </Button>
                </div>
                {experienceFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-3 gap-4 p-4 border rounded-xl bg-slate-50/50">
                    <FormField control={form.control} name={`previousWorkExperience.${index}.company`} render={({ field }) => (<FormItem><FormLabel className="text-[10px]">Company</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name={`previousWorkExperience.${index}.role`} render={({ field }) => (<FormItem><FormLabel className="text-[10px]">Role</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <div className="flex gap-2 items-end">
                      <FormField control={form.control} name={`previousWorkExperience.${index}.years`} render={({ field }) => (<FormItem className="flex-1"><FormLabel className="text-[10px]">Years</FormLabel><FormControl><Input placeholder="2" {...field} /></FormControl><FormMessage /></FormItem>)} />
                      <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => removeExperience(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* IDs */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="aadharNo" render={({ field }) => (<FormItem><FormLabel>Aadhar NO</FormLabel><FormControl><Input placeholder="12 Digit No" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="pfNo" render={({ field }) => (<FormItem><FormLabel>PF NO.</FormLabel><FormControl><Input placeholder="PF Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="esiNo" render={({ field }) => (<FormItem><FormLabel>ESI NO.</FormLabel><FormControl><Input placeholder="ESI Number" {...field} /></FormControl><FormMessage /></FormItem>)} />
              </div>

              {/* Other Documents */}
              <div className="space-y-4 pt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-500 uppercase">Other Documents</h4>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendDocument({ title: "", url: "" })}>
                    <Plus className="h-4 w-4 mr-2" /> Add Document
                  </Button>
                </div>
                {documentFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-2 gap-4 p-4 border rounded-xl bg-slate-50/30">
                    <FormField
                      control={form.control}
                      name={`documents.${index}.title`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-[10px]">Document Title</FormLabel>
                          <FormControl><Input placeholder="e.g. Aadhar Card, Resume" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex gap-2 items-end">
                      <FormField
                        control={form.control}
                        name={`documents.${index}.file`}
                        render={({ field: { onChange, ...fieldProps } }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-[10px]">Upload File</FormLabel>
                            <FormControl>
                              <Input type="file" className="h-9 cursor-pointer file:bg-slate-100 file:border-0 file:rounded-md file:text-[10px] file:font-bold hover:file:bg-slate-200" onChange={(e) => { const file = e.target.files?.[0]; if (file) onChange(file); }} name={fieldProps.name} onBlur={fieldProps.onBlur} ref={fieldProps.ref} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button variant="ghost" size="icon" className="text-rose-500" onClick={() => removeDocument(index)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="mt-4">
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Any additional notes about the employee..." className="resize-none" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="submit" className="bg-[#2eb88a] hover:bg-[#259b74]" disabled={isLoading}>
            {isLoading ? "Saving..." : isEdit ? "Update Employee" : "Register Employee"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
