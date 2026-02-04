'use client';

import { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { crmPatientService } from '@/lib/services/crmPatientService';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface BulkUploadModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface UploadError {
  row: number;
  field: string;
  message: string;
  data: any;
}

export default function BulkUploadModal({ onClose, onSuccess }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<UploadError[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const convertExcelToCSV = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: 'binary' });
          
          // Get first sheet
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to CSV
          const csv = XLSX.utils.sheet_to_csv(worksheet);
          resolve(csv);
        } catch (error) {
          reject(new Error('Failed to parse Excel file'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsBinaryString(file);
    });
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validExtensions = ['.csv', '.xlsx', '.xls'];
      const fileExtension = selectedFile.name.substring(selectedFile.name.lastIndexOf('.')).toLowerCase();
      
      if (!validExtensions.includes(fileExtension)) {
        toast.error('Please upload a CSV or Excel file (.csv, .xlsx, .xls)');
        return;
      }
      
      setFile(selectedFile);
      setErrors([]);
      setSuccessCount(0);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setUploading(true);
    setErrors([]);
    setSuccessCount(0);

    try {
      let csvContent: string;
      const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      
      // Convert Excel to CSV if needed, otherwise read CSV directly
      if (fileExtension === '.csv') {
        csvContent = await file.text();
      } else if (fileExtension === '.xlsx' || fileExtension === '.xls') {
        try {
          // Convert Excel to CSV
          csvContent = await convertExcelToCSV(file);
          if (!csvContent || csvContent.trim().length === 0) {
            toast.error('Excel file is empty or could not be converted');
            setUploading(false);
            return;
          }
        } catch (convertError: any) {
          toast.error(convertError.message || 'Failed to convert Excel file to CSV');
          setUploading(false);
          return;
        }
      } else {
        toast.error('Unsupported file format');
        setUploading(false);
        return;
      }

      // Strip BOM and trim so payload has no leading/trailing newlines (backend expects clean CSV)
      csvContent = csvContent.replace(/^\uFEFF/, '').trim();

      // Create a temporary CSV file object for the service
      const csvBlob = new Blob([csvContent], { type: 'text/csv' });
      const csvFile = new File([csvBlob], file.name.replace(/\.(xlsx|xls)$/i, '.csv'), { type: 'text/csv' });
      
      // Pass converted CSV file to service
      const response = await crmPatientService.bulkUploadPatients(csvFile);
      
      if (response.success) {
        const data = response.data as { successCount: number; errors: UploadError[] };
        setSuccessCount(data.successCount || 0);
        if (data.errors && data.errors.length > 0) {
          setErrors(data.errors);
          toast.error(`Upload completed with ${data.errors.length} errors`);
        } else {
          toast.success(`Successfully uploaded ${data.successCount || 0} patients`);
          onSuccess();
          onClose();
        }
      } else {
        toast.error(response.message || 'Upload failed');
        if ((response.data as any)?.errors) {
          setErrors((response.data as any).errors);
        }
      }
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      const errorMessage = error.message || error.response?.data?.message || 'Failed to upload file';
      toast.error(errorMessage);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
    } finally {
      setUploading(false);
    }
  };

  const downloadErrorReport = () => {
    if (errors.length === 0) return;

    const csvContent = [
      ['Row', 'Field', 'Error Message', 'Data'].join(','),
      ...errors.map(error => 
        [error.row, error.field, `"${error.message}"`, `"${JSON.stringify(error.data)}"`].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bulk_upload_errors_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Bulk Customer Upload</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* File Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload CSV or Excel File
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-primary transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {!file ? (
                  <div>
                    <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      CSV or Excel files (.csv, .xlsx, .xls)
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
                    >
                      Select File
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center space-x-3">
                    <FileSpreadsheet className="w-8 h-8 text-primary" />
                    <div className="text-left">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Field Mapping Info */}
            <div className="bg-blue-50 rounded-xl p-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-2">Expected CSV Format</h4>
              <div className="text-xs text-gray-700 space-y-1">
                <p className="font-medium mb-2">Required columns (in order):</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>• first_name</div>
                  <div>• last_name</div>
                  <div>• email</div>
                  <div>• phone</div>
                  <div>• address</div>
                  <div>• age</div>
                  <div>• gender</div>
                  <div>• date_of_birth</div>
                  <div>• last_visit</div>
                  <div>• next_visit</div>
                  <div>• status</div>
                  <div>• medical_history</div>
                </div>
                <p className="mt-2 text-gray-600 italic">
                  medical_history should be a JSON string, e.g.: {"{"}"allergies":["penicillin"],"conditions":["diabetes"]{"}"}
                </p>
              </div>
            </div>

            {/* Success Message */}
            {successCount > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">
                    Successfully uploaded {successCount} patient(s)
                  </p>
                </div>
              </div>
            )}

            {/* Error List */}
            {errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h4 className="text-sm font-semibold text-red-900">
                      {errors.length} Error(s) Found
                    </h4>
                  </div>
                  <button
                    onClick={downloadErrorReport}
                    className="flex items-center space-x-1 text-sm text-red-700 hover:text-red-900"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Report</span>
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {errors.map((error, index) => (
                    <div key={index} className="bg-white rounded-lg p-3 text-xs">
                      <p className="font-medium text-gray-900">
                        Row {error.row}: {error.field}
                      </p>
                      <p className="text-red-600 mt-1">{error.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4">
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="flex-1 bg-primary text-white py-3 px-4 rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Upload File</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

