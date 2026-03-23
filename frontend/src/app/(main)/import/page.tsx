"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { UploadCloud, Check, Loader2, AlertTriangle, ArrowRight, UserPlus, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { useGetClosersQuery, useAddManualLeadMutation } from '@/store/apiSlice';
import { useUploadLeadsFileMutation } from '@/store/fileApiSlice'; // <-- Import from correct slice

// --- Manual Lead Entry Form Component ---
const AddLeadForm = () => {
    const { lmsUser } = useAuth();
    const canGenerateLeads = lmsUser?.capabilities?.includes('can_generate_leads') || lmsUser?.capabilities?.includes('is_admin');

    const [leadData, setLeadData] = useState({
        name: '', email: '', status: 'new', source: '',
        performanceMetric: '', assignedAgent: '', location: '', contact: '', notes: '',
    });

    // --- RTK Query Hooks ---
    const { data: agents = [], isLoading: agentsLoading } = useGetClosersQuery(undefined, { skip: !canGenerateLeads });
    const [addManualLead, { isLoading }] = useAddManualLeadMutation();

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLeadData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleSelectChange = (name: string, value: string) => {
        setLeadData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- ENHANCED VALIDATION ---
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!leadData.name || !leadData.email) {
        toast.error("Validation Error", { description: "Name and Email are required fields." });
        return;
    }
    if (!emailRegex.test(leadData.email)) {
        toast.error("Validation Error", { description: "Please enter a valid email address." });
        return;
    }
    // -------------------------

    try {
        // --- CORRECTED PAYLOAD ---
        // Ensure the field name matches what the backend expects, e.g., 'assigned_to'
        const payload = {
            ...leadData,
            assigned_to: leadData.assignedAgent, 
        };
        console.log("Sending this payload to backend:", payload);

        const result = await addManualLead(payload).unwrap();
        // -------------------------

        toast.success("Lead Added!", { description: `Successfully added ${leadData.name}.` });
        // Reset the form
        setLeadData({
            name: '', email: '', status: 'new', source: '',
            performanceMetric: '', assignedAgent: '', location: '', contact: '', notes: ''
        });
    } catch (err: any) {
        // ... (rest of the error handling)
    }
};


    return (
        <Card>
            <CardHeader>
                <CardTitle>Add a New Lead</CardTitle>
                <CardDescription>Fill out the form below to manually add a single lead to the system.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="name" placeholder="Full Name" value={leadData.name} onChange={handleChange} required />
                        <Input name="email" type="email" placeholder="Email Address" value={leadData.email} onChange={handleChange} required />
                        <Input name="source" placeholder="Lead Source (e.g., Website)" value={leadData.source} onChange={handleChange} />
                        {canGenerateLeads && (
                            <Select name="assignedAgent" value={leadData.assignedAgent} onValueChange={(value) => handleSelectChange('assignedAgent', value)}>
                                <SelectTrigger disabled={agentsLoading}><SelectValue placeholder="Select agent..." /></SelectTrigger>
                                <SelectContent>
                                    {agents.map((agent: any) => (
                                        <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                        <Input name="location" placeholder="Location (e.g., City, State)" value={leadData.location} onChange={handleChange} />
                        <Input name="contact" placeholder="Contact Number" value={leadData.contact} onChange={handleChange} />
                        <Input name="performanceMetric" placeholder="Performance Metric (e.g., Score)" value={leadData.performanceMetric} onChange={handleChange} />
                    </div>
                    <Textarea name="notes" placeholder="Add a note..." value={leadData.notes} onChange={handleChange} />

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Save Lead
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
};

// --- Import Leads Component ---
const ImportLeadsComponent = () => {
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    
    const [uploadLeadsFile, { isLoading, error: mutationError, data: importResult }] = useUploadLeadsFileMutation();
    const [formError, setFormError] = useState<string | null>(null);

    const lmsFields = ["name", "email", "source", "location", "contact", "performanceMetric"];

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            handleReset();
            setFile(selectedFile);
            parseHeaders(selectedFile);
        }
    }, []);

    const parseHeaders = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: unknown[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (json.length > 0) {
                    const fileHeaders = (json[0] as string[]).map(h => String(h).trim()).filter(h => h);
                    setHeaders(fileHeaders);
                }
            } catch (err) {
                setFormError("Error reading file headers. Please ensure it's a valid CSV or Excel file.");
            }
        };
        reader.readAsBinaryString(file);
    };
    
    const handleReset = () => {
        setFile(null);
        setHeaders([]);
        setColumnMapping({});
        setFormError(null);
        // importResult is reset automatically by the mutation hook
    };
    
    const handleMappingChange = (header: string, lmsField: string) => {
        setColumnMapping(prev => ({ ...prev, [header]: lmsField }));
    };

    const handleImport = async () => {
        if (!file) {
            setFormError("Please select a file first.");
            return;
        }
        
        const finalMapping: Record<string, string> = {};
        for (const header in columnMapping) {
            const dbField = columnMapping[header];
            if (dbField) { 
                finalMapping[header] = dbField;
            }
        }
        
        if (!Object.values(finalMapping).includes('name') || !Object.values(finalMapping).includes('email')) {
            setFormError("Please map columns for both 'name' and 'email' before importing.");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("mapping", JSON.stringify(finalMapping));

        try {
            const result = await uploadLeadsFile(formData).unwrap();
            toast.success("Import Complete!", { description: result.message });
        } catch (err: any) {
            setFormError(err.data?.detail || "An unknown network error occurred.");
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1, accept: { 'text/csv': ['.csv'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] } });

    const error = formError || (mutationError as any)?.data?.detail;

    return (
        <div className="space-y-6">
            <div className="p-6 border rounded-lg bg-card shadow-sm">
                {!file ? (
                    <div {...getRootProps()} className={cn("flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors", isDragActive && "border-primary")}>
                        <input {...getInputProps()} />
                        <p className="font-semibold text-foreground">Drag & drop or click to upload</p>
                        <p className="text-sm text-muted-foreground">.csv or .xlsx</p>
                    </div>
                ) : (
                     <div className="space-y-6">
                          <div className="flex items-center justify-between">
                              <h2 className="text-xl font-semibold">Map Columns</h2>
                              <Button variant="outline" size="sm" onClick={handleReset}>Start Over</Button>
                          </div>
                         <p className="text-muted-foreground -mt-4">Match your file&apos;s columns to the corresponding fields in the LMS.</p>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                             {headers.map(header => (
                                 <div key={header} className="flex items-center gap-2">
                                     <p className="font-medium text-sm text-right w-1/2 truncate" title={header}>{header}</p>
                                     <ArrowRight className="h-4 w-4 text-muted-foreground" />
                                     <div className="w-1/2">
                                         <Select onValueChange={(value) => handleMappingChange(header, value)}>
                                             <SelectTrigger><SelectValue placeholder="Select field..." /></SelectTrigger>
                                             <SelectContent>
                                                 {lmsFields.map(field => <SelectItem key={field} value={field}>{field}</SelectItem>)}
                                             </SelectContent>
                                         </Select>
                                     </div>
                                 </div>
                             ))}
                         </div>
                     </div>
                )}
            </div>
            
            {error && (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-start gap-4">
                    <AlertTriangle className="w-5 h-5 mt-1 flex-shrink-0" />
                    <div><h3 className="font-semibold">Import Failed</h3><p className="text-sm break-words">{error}</p></div>
                </div>
            )}

            {importResult && (
                <div className="p-6 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
                    <h3 className="text-lg font-semibold text-green-500">Import Complete!</h3>
                    <p className="text-green-500 mt-2">{(importResult as any).message}</p>
                    <div className="flex gap-4 justify-center mt-4"><Button onClick={handleReset}>Import Another File</Button></div>
                </div>
            )}

            {headers.length > 0 && !importResult && !error && (
                 <div className="flex justify-end gap-4 mt-8">
                     <Button variant="outline" onClick={handleReset} disabled={isLoading}>Cancel</Button>
                     <Button onClick={handleImport} disabled={isLoading}>
                         {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Check className="w-4 h-4 mr-2"/>}
                         Validate & Import
                     </Button>
                 </div>
            )}
        </div>
    );
};

// --- Main Page Component with Tabs ---
export default function LeadEntryPage() {
    return (
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Lead Management</h1>
                <p className="text-muted-foreground mt-2">Add new leads by importing a file or entering details manually.</p>
            </header>

            <Tabs defaultValue="manual" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="manual">
                        <UserPlus className="w-4 h-4 mr-2" />
                        Manual Entry
                    </TabsTrigger>
                    <TabsTrigger value="import">
                        <UploadCloud className="w-4 h-4 mr-2" />
                        Import from File
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="manual" className="pt-6">
                    <AddLeadForm />
                </TabsContent>
                <TabsContent value="import" className="pt-6">
                    <ImportLeadsComponent />
                </TabsContent>
            </Tabs>
        </div>
    );
}
