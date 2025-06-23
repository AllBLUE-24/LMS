"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { UploadCloud, File as FileIcon, X, Check, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function ImportPage() {
    const [file, setFile] = useState<File | null>(null);
    const [headers, setHeaders] = useState<string[]>([]);
    const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [importResult, setImportResult] = useState<{ status: string; imported_count: number; duplicate_count: number } | null>(null);
    const router = useRouter();

    const lmsFields = ["name", "email", "status", "source", "performanceMetric", "assignedAgent", "location", "contact"];

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const selectedFile = acceptedFiles[0];
        if (selectedFile) {
            handleReset();
            setIsLoading(true);
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
                const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (json.length > 0) {
                    const fileHeaders = (json[0] as string[]).map(h => String(h).trim()).filter(h => h);
                    setHeaders(fileHeaders);
                }
            } catch (err) {
                setError("Error reading file headers. Please ensure it's a valid CSV or Excel file.");
            } finally {
                setIsLoading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleReset = () => {
        setFile(null);
        setHeaders([]);
        setColumnMapping({});
        setError(null);
        setImportResult(null);
        setIsLoading(false);
    };
    
    const handleMappingChange = (header: string, lmsField: string) => {
        setColumnMapping(prev => ({ ...prev, [header]: lmsField }));
    };

    const handleImport = async () => {
        if (!file) {
            setError("Please select a file first.");
            return;
        }

        setIsLoading(true);
        setError(null);

        const finalMapping: Record<string, string> = {};
        for (const header in columnMapping) {
            const dbField = columnMapping[header];
            if (dbField) { 
                finalMapping[header] = dbField;
            }
        }
        
        // Check if essential fields are mapped
        const mappedDbFields = Object.values(finalMapping);
        if (!mappedDbFields.includes('name') || !mappedDbFields.includes('email')) {
            setError("Please map columns for both 'name' and 'email' before importing.");
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("mapping", JSON.stringify(finalMapping));

        try {
            const response = await fetch('http://localhost:8000/api/v1/leads/upload-file', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.detail || 'An unknown error occurred during import.');
            }
            
            setImportResult(result);

        } catch (err: any) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An unknown network error occurred. Please ensure the backend server is running.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

    return (
        <div className="container mx-auto py-10 px-4 md:px-6 max-w-4xl">
            <header className="mb-8 text-center">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900">Import Leads</h1>
                <p className="text-zinc-500 mt-2">Upload a file, map the columns, and import your data.</p>
            </header>

            <div className="space-y-6">
                 {/* File Upload and Mapping in one view */}
                <div className="p-6 border rounded-lg bg-white shadow-sm">
                    {!file ? (
                        <div {...getRootProps()} className={cn("flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50 transition-colors", isDragActive && "border-blue-500")}>
                            <input {...getInputProps()} />
                            <UploadCloud className="w-10 h-10 text-zinc-400 mb-2" />
                            <p className="font-semibold text-zinc-700">Drag & drop or click to upload</p>
                            <p className="text-sm text-zinc-500">.csv or .xlsx</p>
                        </div>
                    ) : (
                         <div className="space-y-6">
                             <div className="flex items-center justify-between">
                                 <h2 className="text-xl font-semibold">Map Columns</h2>
                                 <Button variant="outline" size="sm" onClick={handleReset}>Start Over</Button>
                             </div>
                            <p className="text-zinc-500 -mt-4">Match your file's columns to the corresponding fields in the LMS.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
                                {headers.map(header => (
                                    <div key={header} className="flex items-center gap-2">
                                        <p className="font-medium text-sm text-right w-1/2 truncate" title={header}>{header}</p>
                                        <ArrowRight className="h-4 w-4 text-zinc-400" />
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
                    <div className="p-4 rounded-lg bg-red-50 border border-red-200 text-red-800 flex items-start gap-4">
                        <AlertTriangle className="w-5 h-5 mt-1 flex-shrink-0" />
                        <div><h3 className="font-semibold">Import Failed</h3><p className="text-sm break-words">{error}</p></div>
                    </div>
                )}

                {importResult && (
                    <div className="p-6 rounded-lg bg-green-50 border border-green-200 text-center">
                        <h3 className="text-lg font-semibold text-green-800">Import Complete!</h3>
                        <p className="text-green-700 mt-2">Successfully imported <span className="font-bold">{importResult.imported_count}</span> new leads.</p>
                        <p className="text-sm text-yellow-700 mt-1">Found and skipped <span className="font-bold">{importResult.duplicate_count}</span> duplicates.</p>
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
        </div>
    );
}
