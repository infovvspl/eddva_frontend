import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import schoolApi from '@/lib/api/school-client';
import { Loader2, Download, Plus, CheckCircle2, XCircle, FileWarning, UploadCloud } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export default function DocumentGenerator() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedType, setSelectedType] = useState('ID_CARD_STUDENT');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Student Filters
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Staff Filters
  const [staffIds, setStaffIds] = useState('');

  // Admit Card Filters
  const [examId, setExamId] = useState('');

  // History State
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('');
  
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchClasses();
      await fetchTemplates(selectedType);
    };
    init();
  }, [selectedType]);

  useEffect(() => {
    if (classId && classId !== 'none') {
      fetchSections(classId);
    } else {
      setSections([]);
      setSectionId('');
    }
  }, [classId]);

  useEffect(() => {
    if (sectionId && sectionId !== 'none') {
      fetchStudents(classId, sectionId);
    } else {
      setStudents([]);
      setStudentId('');
    }
  }, [sectionId]);

  const fetchSections = async (cId: string) => {
    try {
      const res = await schoolApi.get(`/academic/sections?classId=${cId}`);
      setSections(res.data?.data || res.data || []);
      setSectionId('');
    } catch (err) {
      console.error('Failed to fetch sections', err);
    }
  };

  const fetchStudents = async (cId: string, sId: string) => {
    try {
      const res = await schoolApi.get(`/students?classId=${cId}&sectionId=${sId}`);
      setStudents(res.data?.data || res.data || []);
      setStudentId('');
    } catch (err) {
      console.error('Failed to fetch students', err);
    }
  };

  const fetchClasses = async () => {
    try {
      const res = await schoolApi.get('/academic/classes');
      setClasses(res.data?.data || res.data || []);
    } catch (err) {
      console.error('Failed to fetch classes', err);
    }
  };

  const fetchTemplates = async (type: string) => {
    try {
      // In a real app we might have a specific STAFF template. For now fallback to STUDENT if not found.
      const queryType = type === 'ID_CARD_STAFF' ? 'ID_CARD_STUDENT' : type;
      const res = await schoolApi.get(`/institute-admin/document/template/${queryType}`);
      setTemplates(res.data?.data || res.data || []);
      if ((res.data?.data || res.data)?.length > 0) {
        setSelectedTemplate((res.data?.data || res.data)[0].id);
      } else {
        setSelectedTemplate('');
      }
    } catch (err) {
      console.error('Failed to fetch templates:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await schoolApi.get('/institute-admin/document/id-card/history');
      setHistoryLogs(res.data?.data || res.data || []);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load card history', variant: 'destructive' });
    }
  };

  const handleGenerateIdCard = async (target: 'STUDENT' | 'STAFF') => {
    if (!selectedTemplate) {
      return toast({ title: 'Error', description: 'Please select a template.', variant: 'destructive' });
    }

    const cId = (classId && classId !== 'none') ? classId : undefined;
    const sId = (sectionId && sectionId !== 'none') ? sectionId : undefined;
    const stId = (studentId && studentId !== 'none') ? studentId : undefined;

    const payload = {
      targetType: cId ? 'CLASS' : 'INDIVIDUAL',
      classId: cId,
      sectionId: sId,
      studentIds: stId ? [stId] : undefined,
      staffIds: staffIds ? staffIds.split(',').map(s => s.trim()) : undefined,
      templateId: selectedTemplate,
    };

    setLoading(true);
    try {
      const res = await schoolApi.post('/institute-admin/document/generate/id-card', payload);
      const base64Data = res.data?.pdfBase64 || res.data?.data?.pdfBase64;
      if (!base64Data) throw new Error('Invalid PDF format returned from server');
      
      const fileUrl = `data:application/pdf;base64,${base64Data}`;
      console.log('PDF Base64 size (ID Card):', base64Data.length);
      
      toast({ title: 'Success', description: `${target} ID Cards generated successfully!` });
      
      setPreviewUrl(fileUrl);
      setPreviewFilename(`ID-Cards-${new Date().getTime()}.pdf`);
      loadHistory();
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: err.response?.data?.message || 'Could not generate ID cards.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAdmitCard = async () => {
    if (!selectedTemplate || !examId) {
      return toast({ title: 'Error', description: 'Please select a template and an exam.', variant: 'destructive' });
    }
    setLoading(true);

    const cId = (classId && classId !== 'none') ? classId : undefined;
    const sId = (sectionId && sectionId !== 'none') ? sectionId : undefined;
    const stId = (studentId && studentId !== 'none') ? studentId : undefined;

    const payload = {
      examId,
      classId: cId,
      sectionId: sId,
      studentIds: stId ? [stId] : undefined,
      templateId: selectedTemplate,
    };

    try {
      const res = await schoolApi.post('/institute-admin/document/generate/admit-card', payload);
      const base64Data = res.data?.pdfBase64 || res.data?.data?.pdfBase64;
      if (!base64Data) throw new Error('Invalid PDF format returned from server');
      
      const fileUrl = `data:application/pdf;base64,${base64Data}`;
      console.log('PDF Base64 size (Admit Card):', base64Data.length);
      
      toast({ title: 'Success', description: 'Admit Cards generated successfully!' });
      
      setPreviewUrl(fileUrl);
      setPreviewFilename(`Admit-Cards-${new Date().getTime()}.pdf`);
      loadHistory();
    } catch (err: any) {
      toast({ title: 'Generation Failed', description: 'Could not generate admit cards.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await schoolApi.post(`/institute-admin/document/id-card/${id}/status`, { status });
      toast({ title: 'Success', description: `Card marked as ${status}` });
      loadHistory();
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    }
  };

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!studentId || studentId === 'none') return;
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      formData.append('path', 'student-profiles');
      
      const uploadRes = await schoolApi.post('/media/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const photoUrl = uploadRes.data?.data?.url || uploadRes.data?.url;
      
      if (!photoUrl) throw new Error('Upload failed');
      
      await schoolApi.put(`/institute-admin/student/${studentId}`, { profileImage: photoUrl });
      toast({ title: 'Success', description: 'Student photo uploaded and saved.' });
      
      // refresh students
      if (classId && sectionId) fetchStudents(classId, sectionId);
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Generator</h1>
          <p className="text-muted-foreground">Generate and manage printable ID Cards and Admit Cards in bulk.</p>
        </div>
        <Button onClick={() => toast({ title: "Coming Soon", description: "Template Builder UI is under construction." })}>
          <Plus className="w-4 h-4 mr-2" /> New Template
        </Button>
      </div>

      <Tabs defaultValue="id-cards" className="w-full" onValueChange={(v) => {
        if (v === 'id-cards') setSelectedType('ID_CARD_STUDENT');
        else if (v === 'staff-cards') setSelectedType('ID_CARD_STAFF');
        else if (v === 'admit-cards') setSelectedType('ADMIT_CARD');
        else if (v === 'history') loadHistory();
      }}>
        <TabsList className="mb-4">
          <TabsTrigger value="id-cards">Student ID Cards</TabsTrigger>
          <TabsTrigger value="staff-cards">Staff ID Cards</TabsTrigger>
          <TabsTrigger value="admit-cards">Admit Cards</TabsTrigger>
          <TabsTrigger value="history">Card History</TabsTrigger>
        </TabsList>

        {/* STUDENT ID CARDS */}
        <TabsContent value="id-cards">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Generate Student ID Cards</CardTitle>
              <CardDescription>Select a class or specific students to generate printable QR-enabled ID cards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.length === 0 && <SelectItem value="none" disabled>No classes found</SelectItem>}
                      {classes.map((c: any) => (
                        <SelectItem key={c?.id} value={c?.id || 'none'}>{c?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={sectionId} onValueChange={setSectionId} disabled={!classId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Section" />
                    </SelectTrigger>
                    <SelectContent>
                      {sections.length === 0 && <SelectItem value="none" disabled>No sections</SelectItem>}
                      {sections.map((s: any) => (
                        <SelectItem key={s?.id} value={s?.id || 'none'}>{s?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Specific Student (Optional)</Label>
                  <Select value={studentId} onValueChange={setStudentId} disabled={!sectionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Students</SelectItem>
                      {students.map((st: any) => (
                        <SelectItem key={st?.id} value={st?.id || 'none'}>
                          {st?.name} ({st?.studentProfile?.enrollmentNo || st?.studentProfile?.rollNo || 'No Reg'}) {st?.studentProfile?.profileImage || st?.profileImage ? '✓' : '(No Photo)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {studentId && studentId !== 'none' && (
                    <div className="mt-2">
                      <Label htmlFor="photo-upload" className="cursor-pointer">
                        <div className="flex items-center gap-2 text-sm text-primary font-medium p-2 border border-primary/20 rounded-md hover:bg-primary/5 transition-colors w-fit">
                          {uploadingPhoto ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                          {uploadingPhoto ? 'Uploading...' : 'Upload/Update Photo for Selected Student'}
                        </div>
                      </Label>
                      <input id="photo-upload" type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} disabled={uploadingPhoto} />
                    </div>
                  )}
                </div>
                <div className="space-y-2 md:col-span-1">
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.length === 0 && <SelectItem value="none" disabled>No templates found</SelectItem>}
                      {templates.map(t => (
                        <SelectItem key={t?.id} value={t?.id || 'none'}>{t?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => handleGenerateIdCard('STUDENT')} disabled={loading} className="w-full md:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && <Download className="mr-2 h-4 w-4" />}
                Generate Student ID Cards
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STAFF ID CARDS */}
        <TabsContent value="staff-cards">
          <Card>
            <CardHeader>
              <CardTitle>Generate Staff ID Cards</CardTitle>
              <CardDescription>Enter staff IDs to generate professional employee ID cards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Staff User IDs</Label>
                  <Input placeholder="Comma separated user UUIDs" value={staffIds} onChange={(e) => setStaffIds(e.target.value)} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.length === 0 && <SelectItem value="none" disabled>No templates found</SelectItem>}
                      {templates.map(t => (
                        <SelectItem key={t?.id} value={t?.id || 'none'}>{t?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={() => handleGenerateIdCard('STAFF')} disabled={loading} className="w-full md:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && <Download className="mr-2 h-4 w-4" />}
                Generate Staff ID Cards
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ADMIT CARDS */}
        <TabsContent value="admit-cards">
          <Card>
            <CardHeader>
              <CardTitle>Bulk Generate Admit Cards</CardTitle>
              <CardDescription>Generate admit cards containing exam timetables for a specific exam.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Exam ID</Label>
                  <Input placeholder="Enter Exam ID (e.g. MID-TERM-2026)" value={examId} onChange={(e) => setExamId(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Class (Optional)</Label>
                  <Select value={classId} onValueChange={setClassId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Classes</SelectItem>
                      {classes.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Template</Label>
                  <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.length === 0 && <SelectItem value="none" disabled>No templates found</SelectItem>}
                      {templates.map(t => (
                        <SelectItem key={t?.id} value={t?.id || 'none'}>{t?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button onClick={handleGenerateAdmitCard} disabled={loading} className="w-full md:w-auto">
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {!loading && <Download className="mr-2 h-4 w-4" />}
                Generate Admit Cards PDF
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* HISTORY */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>ID Card Tracking</CardTitle>
              <CardDescription>Manage previously generated cards, revoke access, or track lost cards.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Target ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Issued At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyLogs.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        No ID cards generated yet.
                      </TableCell>
                    </TableRow>
                  )}
                  {historyLogs.map(log => (
                    <TableRow key={log?.id}>
                      <TableCell className="font-medium">{log?.targetType}</TableCell>
                      <TableCell className="text-xs text-muted-foreground" title={log?.targetId}>
                        {log?.targetId?.substring(0,8)}...
                      </TableCell>
                      <TableCell>
                        {log?.status === 'ACTIVE' && <span className="inline-flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full text-xs font-semibold"><CheckCircle2 className="w-3 h-3 mr-1"/> Active</span>}
                        {log?.status === 'LOST' && <span className="inline-flex items-center text-red-600 bg-red-50 px-2 py-1 rounded-full text-xs font-semibold"><FileWarning className="w-3 h-3 mr-1"/> Lost</span>}
                        {log?.status === 'INACTIVE' && <span className="inline-flex items-center text-gray-600 bg-gray-100 px-2 py-1 rounded-full text-xs font-semibold"><XCircle className="w-3 h-3 mr-1"/> Inactive</span>}
                      </TableCell>
                      <TableCell>{log?.issuedAt ? new Date(log.issuedAt).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {log?.status === 'ACTIVE' && (
                          <Button variant="outline" size="sm" onClick={() => updateStatus(log.id, 'LOST')}>
                            Mark Lost
                          </Button>
                        )}
                        {log?.status === 'LOST' && (
                          <Button variant="outline" size="sm" onClick={() => updateStatus(log.id, 'ACTIVE')}>
                            Re-activate
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      <Dialog open={!!previewUrl} onOpenChange={(open) => !open && setPreviewUrl(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] flex flex-col p-4 sm:p-6 rounded-2xl border-none shadow-2xl glass-panel">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
              Document Preview
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 w-full relative min-h-0 bg-slate-100 dark:bg-slate-900 rounded-xl overflow-hidden border border-border shadow-inner mt-4">
            {previewUrl && (
              <object 
                data={previewUrl} 
                type="application/pdf"
                className="w-full h-full border-0 absolute inset-0"
              >
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                  <FileWarning className="w-12 h-12 mb-4 opacity-50" />
                  <p>Your browser does not support inline PDF previews.</p>
                  <p className="text-sm mt-2">Please use the Download button below.</p>
                </div>
              </object>
            )}
          </div>
          
          <DialogFooter className="flex-shrink-0 mt-6 sm:justify-end gap-3 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setPreviewUrl(null)}
              className="rounded-xl border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                if (previewUrl) {
                  const a = document.createElement('a');
                  a.href = previewUrl;
                  a.download = previewFilename;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                }
              }}
              className="rounded-xl bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
