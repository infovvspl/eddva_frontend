import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/lib/api/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, FileWarning, Loader2, User as UserIcon } from 'lucide-react';

export default function IdCardVerificationPage() {
  const { code } = useParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyCard = async () => {
      try {
        const res = await apiClient.get(`/institute-admin/document/verify-id-card/${code}`);
        setData(res.data.data || res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Invalid or unknown QR Code');
      } finally {
        setLoading(false);
      }
    };
    verifyCard();
  }, [code]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
          <p className="text-sm text-slate-500 font-medium">Verifying ID Card...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50 p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50 text-center shadow-sm">
          <CardContent className="pt-6">
            <XCircle className="mx-auto h-16 w-16 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-red-900">Verification Failed</h2>
            <p className="text-red-700 mt-2">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-slate-50 p-4 font-sans">
      <Card className="max-w-sm w-full overflow-hidden shadow-lg border-t-4 border-t-blue-600">
        <CardHeader className="text-center pb-4 border-b bg-white">
          <div className="mx-auto h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center border-4 border-white shadow-sm mb-4">
            <UserIcon className="h-10 w-10 text-slate-400" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-900">{data?.name}</CardTitle>
          <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">{data?.targetType} ID</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6 bg-slate-50/50">
          
          <div className="flex flex-col items-center p-4 rounded-xl bg-white border shadow-sm">
            {data?.status === 'ACTIVE' && (
              <>
                <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-2" />
                <span className="text-lg font-bold text-emerald-700 uppercase tracking-wide">Valid & Active</span>
              </>
            )}
            {data?.status === 'INACTIVE' && (
              <>
                <XCircle className="h-12 w-12 text-slate-400 mb-2" />
                <span className="text-lg font-bold text-slate-600 uppercase tracking-wide">Inactive Card</span>
              </>
            )}
            {data?.status === 'LOST' && (
              <>
                <FileWarning className="h-12 w-12 text-red-500 mb-2" />
                <span className="text-lg font-bold text-red-700 uppercase tracking-wide">Reported Lost</span>
              </>
            )}
            <p className="text-xs text-slate-400 mt-2 text-center">
              Issued: {new Date(data?.issuedAt).toLocaleDateString()}
            </p>
          </div>

          <div className="bg-white rounded-xl border p-4 shadow-sm space-y-3">
            {data?.details?.rollNo && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Roll No</span>
                <span className="font-semibold text-slate-900">{data.details.rollNo}</span>
              </div>
            )}
            {data?.details?.classId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Class</span>
                <span className="font-semibold text-slate-900">{data.details.classId}</span>
              </div>
            )}
            {data?.details?.employeeId && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Employee ID</span>
                <span className="font-semibold text-slate-900">{data.details.employeeId}</span>
              </div>
            )}
          </div>
          
          <div className="text-center pt-2">
            <p className="text-xs text-slate-400">Verified by EDDVA Security System</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
