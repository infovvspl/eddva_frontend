import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import schoolApi from '@/lib/api/school-client';
import { Loader2, Download, Plus, CheckCircle2, XCircle, FileWarning, UploadCloud, AlertTriangle } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CustomSelect } from "@/components/ui/CustomSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useSchoolAuth } from '@/context/SchoolAuthContext';
import Handlebars from 'handlebars';

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
  const [staffList, setStaffList] = useState<any[]>([]);
  const [staffId, setStaffId] = useState('');

  // Admit Card Filters
  const [examId, setExamId] = useState('');

  // History State
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFilename, setPreviewFilename] = useState<string>('');
  
  const { institute } = useSchoolAuth();
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [editTemplateObj, setEditTemplateObj] = useState<any>(null);
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    // Check if the institute has a logo
    if (institute?.logo) {
      setSchoolLogo(institute.logo);
    }
  }, [institute]);

  useEffect(() => {
    const init = async () => {
      await fetchClasses();
      await fetchStaff();
      await fetchTemplates(selectedType);
      await loadHistory();
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

  const fetchStudents = async (cId: string, sId: string, preserveSelection = false) => {
    try {
      const res = await schoolApi.get(`/students?classId=${cId}&sectionId=${sId}`);
      setStudents(res.data?.data || res.data || []);
      if (!preserveSelection) setStudentId('');
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

  const fetchStaff = async () => {
    try {
      const res = await schoolApi.get('/teachers?limit=100');
      setStaffList(res.data?.data || res.data?.items || res.data || []);
    } catch (err) {
      console.error('Failed to fetch staff', err);
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
  // Helper to convert base64 to Blob URL
  const base64ToBlobUrl = (base64: string, type = 'application/pdf') => {
    const binaryString = window.atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type });
    return URL.createObjectURL(blob);
  };

  // Generate a realistic preview for templates
  const getMockHtml = (htmlContent: string) => {
    const injectedStyles = `
      <style>
        html { overflow: hidden !important; }
        body { margin: 0 !important; padding: 0 !important; overflow: hidden !important; background: transparent !important; scrollbar-width: none; }
        ::-webkit-scrollbar { display: none !important; }
        .card-page { width: 100% !important; max-width: 100% !important; min-height: 100vh !important; margin: 0 !important; box-shadow: none !important; border: none !important; }
        .card-page:nth-of-type(n+2) { display: none !important; }
      </style>
    `;

    // Replace variables with mock data based on selected type
    const mockData: any = selectedType === 'ID_CARD_STAFF' ? {
      schoolLogo: schoolLogo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop',
      schoolName: institute?.name || 'Eddva School',
      schoolAddress: institute?.address || '123 Education Lane, City, State 12345',
      fullName: 'Johnathan Doe',
      firstName: 'Johnathan',
      lastName: 'Doe',
      department: 'Academic',
      employeeId: 'EMP-12345',
      profileImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&h=200&fit=crop',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MockQR',
      bloodGroup: 'O+',
      phone: '+1 234-567-8900'
    } : {
      schoolLogo: schoolLogo || 'https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=100&h=100&fit=crop',
      schoolName: institute?.name || 'Eddva School',
      schoolAddress: institute?.address || '123 Education Lane, City, State 12345',
      fullName: 'Johnathan Doe',
      firstName: 'Johnathan',
      lastName: 'Doe',
      fatherName: 'Richard Doe',
      motherName: 'Jane Doe',
      parentName: 'Richard Doe',
      className: 'Class 10',
      section: 'A',
      dob: '15/08/2008',
      profileImage: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=200&h=200&fit=crop',
      qrCode: 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=MockQR',
      center: 'Main Campus Hall',
      examName: examId || 'MID-TERM 2026',
      timetable: [
        { subject: 'Mathematics', date: '10 Oct 2026', time: '10:00 AM - 01:00 PM' },
        { subject: 'Science', date: '12 Oct 2026', time: '10:00 AM - 01:00 PM' },
        { subject: 'English', date: '14 Oct 2026', time: '10:00 AM - 01:00 PM' }
      ]
    };

    let renderedHtml = '';
    try {
      const template = Handlebars.compile(htmlContent || '');
      if (htmlContent?.includes('{{#each items}}') || htmlContent?.includes('{{#each this.items}}')) {
        renderedHtml = template({ items: [mockData] });
      } else if (htmlContent?.includes('{{#each this}}')) {
        renderedHtml = template([mockData]);
      } else {
        renderedHtml = template(mockData);
      }
    } catch (err: any) {
      renderedHtml = '<div style="color:red; padding:20px; font-family:sans-serif;">Template Error: ' + err.message + '</div>';
    }

    return `
      <!DOCTYPE html>
      <html>
        <head>
          ${injectedStyles}
        </head>
        <body>
          <div id="preview-root">${renderedHtml}</div>
        </body>
      </html>
    `;
  };

  const getIframeStyles = (t: any) => {
    // ID Cards default to 380x560 to account for the 20px margin in their CSS templates
    let width = 380;
    let height = 560;
    
    let dims = t.dimensions;
    if (typeof dims === 'string') {
      try { dims = JSON.parse(dims); } catch(e) {}
    }
    
    if (t.type === 'ADMIT_CARD' && dims?.width && dims?.height) {
      // Admit Cards CSS uses physical dimensions (mm) which scale perfectly
      width = dims.width * 3.78;
      height = dims.height * 3.78;
    }
    // ID Cards default to 340x520 as per their CSS templates
    
    // Target display width inside the thumbnail
    const targetDisplayWidth = 210; 
    const scale = targetDisplayWidth / width;
    
    return {
      width: `${width}px`,
      height: `${height}px`,
      maxWidth: 'none',
      transform: `scale(${scale})`,
      transformOrigin: 'top left',
      left: '5px', // Center the 210px scaled width inside the 220px container
      border: 'none'
    };
  };

  const handleGenerateIdCard = async (target: 'STUDENT' | 'STAFF') => {
    if (!selectedTemplate) {
      return toast({ title: 'Error', description: 'Please select a template.', variant: 'destructive' });
    }

    const cId = (classId && classId !== 'none') ? classId : undefined;
    const sId = (sectionId && sectionId !== 'none') ? sectionId : undefined;
    const stId = (studentId && studentId !== 'none') ? studentId : undefined;
    const tId = (staffId && staffId !== 'none') ? staffId : undefined;

    let targetType = 'INDIVIDUAL';
    if (target === 'STUDENT') {
      if (stId) targetType = 'INDIVIDUAL';
      else if (cId) targetType = 'CLASS';
    } else {
      if (tId) targetType = 'STAFF_INDIVIDUAL';
      else targetType = 'STAFF'; // all staff
    }

    const payload = {
      targetType,
      classId: cId,
      sectionId: sId,
      studentIds: stId ? [stId] : undefined,
      staffIds: tId ? [tId] : undefined,
      templateId: selectedTemplate,
    };

    setLoading(true);
    try {
      const res = await schoolApi.post('/institute-admin/document/generate/id-card', payload);
      const base64Data = res.data?.pdfBase64 || res.data?.data?.pdfBase64;
      if (!base64Data) throw new Error('Invalid PDF format returned from server');
      
      const fileUrl = base64ToBlobUrl(base64Data);
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
      
      const fileUrl = base64ToBlobUrl(base64Data);
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

  const previewHistoryCard = async (log: any) => {
    try {
      setLoading(true);
      // Fetch templates for the log document type just to get the active ID
      const tRes = await schoolApi.get(`/institute-admin/document/template/${log.documentType || 'ID_CARD_STUDENT'}`);
      const tId = (tRes.data?.data || tRes.data)?.[0]?.id;
      if (!tId) throw new Error("Template not found for preview.");

      const payload = {
        targetType: log.targetType === 'STUDENT' ? 'INDIVIDUAL' : 'STAFF',
        studentIds: log.targetType === 'STUDENT' ? [log.targetId] : undefined,
        staffIds: log.targetType === 'STAFF' ? [log.targetId] : undefined,
        templateId: tId,
      };

      const res = await schoolApi.post('/institute-admin/document/generate/id-card', payload);
      const base64Data = res.data?.pdfBase64 || res.data?.data?.pdfBase64;
      if (!base64Data) throw new Error('Invalid PDF format returned from server');
      
      const fileUrl = base64ToBlobUrl(base64Data);
      setPreviewUrl(fileUrl);
      setPreviewFilename(`Preview-${log.targetId}.pdf`);
    } catch (err: any) {
      toast({ title: 'Preview Failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
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
      
      const uploadRes = await schoolApi.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const photoUrl = uploadRes.data?.data?.fileUrl || uploadRes.data?.fileUrl || uploadRes.data?.data?.url || uploadRes.data?.url;
      
      if (!photoUrl) throw new Error('Upload failed');
      
      await schoolApi.put(`/students/${studentId}`, { profileImage: photoUrl });
      toast({ title: 'Success', description: 'Student photo uploaded and saved.' });
      
      // refresh students
      if (classId && sectionId) fetchStudents(classId, sectionId, true);
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'image');
      formData.append('path', 'institute-logos');
      const uploadRes = await schoolApi.post('/materials/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      const logoUrl = uploadRes.data?.data?.fileUrl || uploadRes.data?.fileUrl || uploadRes.data?.data?.url || uploadRes.data?.url;
      if (!logoUrl) throw new Error('Upload failed');

      // Update institute with the new logo
      await schoolApi.put(`/institute-admin/institute/${institute?.id}`, { logo: logoUrl });
      setSchoolLogo(logoUrl);
      toast({ title: 'Success', description: 'School logo uploaded successfully! It will appear on all generated ID cards.' });
    } catch (err: any) {
      toast({ title: 'Upload Failed', description: err.response?.data?.message || err.message, variant: 'destructive' });
    } finally {
      setUploadingLogo(false);
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
      </div>

      {/* School Logo Warning Banner */}
      {!schoolLogo && (
        <div className="flex items-center gap-3 p-4 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-700">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-300">No School Logo Found</p>
            <p className="text-xs text-amber-600 dark:text-amber-400">Upload your school logo so it appears on all generated ID cards.</p>
          </div>
          <label>
            <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} disabled={uploadingLogo} />
            <Button variant="outline" size="sm" asChild className="cursor-pointer border-amber-400">
              <span>{uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UploadCloud className="w-4 h-4 mr-1" />} Upload Logo</span>
            </Button>
          </label>
        </div>
      )}
      {schoolLogo && (
        <div className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-700">
          <img src={schoolLogo} alt="School Logo" className="w-10 h-10 rounded-full object-cover border" />
          <div className="flex-1">
            <p className="text-sm font-medium text-green-800 dark:text-green-300">School Logo Active</p>
            <p className="text-xs text-green-600 dark:text-green-400">This logo will appear on all generated ID cards.</p>
          </div>
          <label>
            <input type="file" accept="image/*" className="hidden" onChange={handleUploadLogo} disabled={uploadingLogo} />
            <Button variant="ghost" size="sm" asChild className="cursor-pointer">
              <span>{uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change'}</span>
            </Button>
          </label>
        </div>
      )}

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
                <div className="space-y-3 md:col-span-2 mt-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Select Template Theme</Label>
                  </div>
                  
                  {templates.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl border-dashed bg-slate-50 dark:bg-slate-900 text-muted-foreground">
                      No templates available. Please seed templates or create one.
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x px-2">
                      {templates.map(t => {
                        const isSelected = selectedTemplate === t.id;
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => setSelectedTemplate(t.id)}
                            className={`snap-center flex-shrink-0 cursor-pointer group relative rounded-xl border-2 transition-all duration-200 overflow-hidden bg-white ${
                              isSelected ? 'border-primary ring-4 ring-primary/20 shadow-lg scale-[1.02]' : 'border-border hover:border-primary/50 hover:shadow-md hover:-translate-y-1'
                            }`}
                            style={{ width: '220px' }}
                          >
                            <div className="bg-slate-100 relative h-[330px] overflow-hidden rounded-t-lg flex items-center justify-center">
                              <iframe 
                                srcDoc={getMockHtml(t.htmlContent)}
                                scrolling="no"
                                className="absolute top-0 left-0 pointer-events-none"
                                style={getIframeStyles(t)}
                                title={t.name}
                              />
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-md z-10">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-950 border-t">
                              <h3 className="font-semibold text-sm truncate">{t.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">Click to select</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={() => handleGenerateIdCard('STUDENT')} disabled={loading} className="w-full md:w-auto mt-6">
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
              <CardDescription>Select a teacher to generate professional employee ID cards.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Specific Teacher (Optional)</Label>
                  <Select value={staffId} onValueChange={setStaffId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Teachers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Teachers</SelectItem>
                      {staffList.map((st: any) => (
                        <SelectItem key={st?.id} value={st?.id || 'none'}>{st?.name || 'Unknown Teacher'}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 md:col-span-2 mt-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Select Template Theme</Label>
                  </div>
                  
                  {templates.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl border-dashed bg-slate-50 dark:bg-slate-900 text-muted-foreground">
                      No templates available. Please seed templates or create one.
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x px-2">
                      {templates.map(t => {
                        const isSelected = selectedTemplate === t.id;
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => setSelectedTemplate(t.id)}
                            className={`snap-center flex-shrink-0 cursor-pointer group relative rounded-xl border-2 transition-all duration-200 overflow-hidden bg-white ${
                              isSelected ? 'border-primary ring-4 ring-primary/20 shadow-lg scale-[1.02]' : 'border-border hover:border-primary/50 hover:shadow-md hover:-translate-y-1'
                            }`}
                            style={{ width: '220px' }}
                          >
                            <div className="bg-slate-100 relative h-[330px] overflow-hidden rounded-t-lg flex items-center justify-center">
                              <iframe 
                                srcDoc={getMockHtml(t.htmlContent)}
                                scrolling="no"
                                className="absolute top-0 left-0 pointer-events-none"
                                style={getIframeStyles(t)}
                                title={t.name}
                              />
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-md z-10">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-950 border-t">
                              <h3 className="font-semibold text-sm truncate">{selectedType === 'ID_CARD_STAFF' ? t.name.replace(/Student/ig, 'Staff') : t.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">Click to select</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
              <Button onClick={() => handleGenerateIdCard('STAFF')} disabled={loading} className="w-full md:w-auto mt-6">
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
                <div className="space-y-2">
                  <Label>Section (Optional)</Label>
                  <Select value={sectionId} onValueChange={setSectionId} disabled={!classId || classId === 'none'}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Sections" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Sections</SelectItem>
                      {sections.map((s: any) => (
                        <SelectItem key={s?.id} value={s?.id || 'none'}>{s?.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Specific Student (Optional)</Label>
                  <Select value={studentId} onValueChange={setStudentId} disabled={!sectionId || sectionId === 'none'}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">All Students</SelectItem>
                      {students.map((st: any) => (
                        <SelectItem key={st?.id} value={st?.id || 'none'}>
                          {st?.name} ({st?.studentProfile?.enrollmentNo || st?.studentProfile?.rollNo || 'No Reg'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 md:col-span-2 mt-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-semibold">Select Template Theme</Label>
                  </div>
                  
                  {templates.length === 0 ? (
                    <div className="p-8 text-center border rounded-xl border-dashed bg-slate-50 dark:bg-slate-900 text-muted-foreground">
                      No templates available. Please seed templates or create one.
                    </div>
                  ) : (
                    <div className="flex gap-4 overflow-x-auto pb-4 pt-2 snap-x px-2">
                      {templates.map(t => {
                        const isSelected = selectedTemplate === t.id;
                        return (
                          <div 
                            key={t.id} 
                            onClick={() => setSelectedTemplate(t.id)}
                            className={`snap-center flex-shrink-0 cursor-pointer group relative rounded-xl border-2 transition-all duration-200 overflow-hidden bg-white ${
                              isSelected ? 'border-primary ring-4 ring-primary/20 shadow-lg scale-[1.02]' : 'border-border hover:border-primary/50 hover:shadow-md hover:-translate-y-1'
                            }`}
                            style={{ width: '220px' }}
                          >
                            <div className="bg-slate-100 relative h-[330px] overflow-hidden rounded-t-lg flex items-center justify-center">
                              <iframe 
                                srcDoc={getMockHtml(t.htmlContent)}
                                scrolling="no"
                                className="absolute top-0 left-0 pointer-events-none"
                                style={getIframeStyles(t)}
                                title={t.name}
                              />
                              {isSelected && (
                                <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1 shadow-md z-10">
                                  <CheckCircle2 className="w-5 h-5" />
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-white dark:bg-slate-950 border-t">
                              <h3 className="font-semibold text-sm truncate">{selectedType === 'ID_CARD_STAFF' ? t.name.replace(/Student/ig, 'Staff') : t.name}</h3>
                              <p className="text-xs text-muted-foreground mt-1">Click to select</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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
                        <Button variant="outline" size="sm" onClick={() => previewHistoryCard(log)}>
                          Preview
                        </Button>
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

      {/* Edit Template HTML Modal */}
      <Dialog open={!!editTemplateObj} onOpenChange={(open) => !open && setEditTemplateObj(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-6 rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-950">
          <DialogHeader className="flex-shrink-0 mb-2">
            <DialogTitle className="text-2xl font-bold">Template HTML Source</DialogTitle>
            <p className="text-sm text-muted-foreground">Modify the raw Handlebars HTML for this template. Be careful not to break the Handlebars variables (e.g. {`{{firstName}}`}).</p>
          </DialogHeader>
          
          <div className="flex-1 w-full relative min-h-0 rounded-xl overflow-hidden shadow-inner border border-border">
            <textarea 
              className="w-full h-full p-4 font-mono text-[13px] bg-slate-900 text-emerald-400 focus:outline-none resize-none whitespace-pre"
              value={editTemplateObj?.htmlContent || ''}
              onChange={(e) => setEditTemplateObj({ ...editTemplateObj, htmlContent: e.target.value })}
              spellCheck={false}
            />
          </div>
          
          <DialogFooter className="mt-4 flex justify-end gap-2 flex-shrink-0">
            <Button variant="outline" onClick={() => setEditTemplateObj(null)}>Cancel</Button>
            <Button onClick={async () => {
              try {
                await schoolApi.put(`/institute-admin/document/template/${editTemplateObj.id}`, { htmlContent: editTemplateObj.htmlContent });
                toast({ title: 'Success', description: 'Template design updated successfully!' });
                setEditTemplateObj(null);
                fetchTemplates(selectedType);
              } catch (err) {
                toast({ title: 'Error', description: 'Failed to update template', variant: 'destructive' });
              }
            }}>Save Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
