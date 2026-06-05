import React, { useState, useEffect } from 'react';
import { MessageSquareWarning, Plus, Filter, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import GlassCard from '@/components/school/GlassCard';
import Button from '@/components/school/Button';
import Badge from '@/components/school/Badge';
import Tabs from '@/components/school/Tabs';
import DataTable from '@/components/school/DataTable';
import Modal from '@/components/school/Modal';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import api from '@/lib/api/school-client';
import './GrievanceHandling.css';

const GrievanceHandling: React.FC = () => {
  const [showComplaintModal, setShowComplaintModal] = useState(false);
  const [grievancesList, setGrievancesList] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    category: 'academic',
    priority: 'medium',
    description: ''
  });

  const fetchGrievances = async () => {
    try {
      const res = await api.get('/grievances');
      const formatted = res.data.data.map((g: any) => ({
        ...g,
        status: (g.status || 'open').toLowerCase(),
        raisedBy: g.raised_by_name || 'Anonymous',
        date: new Date(g.created_at).toLocaleDateString(),
        // mock priority since backend doesn't store it yet
        priority: 'medium' 
      }));
      setGrievancesList(formatted);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchGrievances();
  }, []);

  const handleCreateComplaint = async () => {
    try {
      await api.post('/grievances', formData);
      fetchGrievances();
      setShowComplaintModal(false);
      setFormData({ title: '', category: 'academic', priority: 'medium', description: '' });
    } catch (err) {
      console.error(err);
    }
  };


  const columns = [
    { key: 'title', title: 'Complaint' },
    { key: 'category', title: 'Category', render: (v: string) => (
      <Badge variant={v === 'academic' ? 'purple' : v === 'infrastructure' ? 'info' : 'warning'}>{v}</Badge>
    )},
    { key: 'priority', title: 'Priority', render: (v: string) => (
      <Badge variant={v === 'high' ? 'error' : v === 'medium' ? 'warning' : 'success'}>{v}</Badge>
    )},
    { key: 'raisedBy', title: 'Raised By' },
    { key: 'class', title: 'Class', render: (v: string) => <Badge variant="default">{v}</Badge> },
    { key: 'date', title: 'Date' },
    { key: 'status', title: 'Status', render: (v: string) => {
      const icons: Record<string, React.ReactNode> = {
        open: <AlertCircle size={14} />,
        'in-progress': <Clock size={14} />,
        resolved: <CheckCircle size={14} />,
        closed: <XCircle size={14} />,
      };
      const variants: Record<string, string> = {
        open: 'error',
        'in-progress': 'warning',
        resolved: 'success',
        closed: 'default',
      };
      return (
        <Badge variant={variants[v] as any}>
          <span className="grievance__status-badge">{icons[v]} {v}</span>
        </Badge>
      );
    }},
  ];

  const allContent = (
    <div className="grievance__section">
      <DataTable columns={columns} data={grievancesList} />
    </div>
  );

  const academicContent = (
    <div className="grievance__section">
      <DataTable columns={columns} data={grievancesList.filter((g) => g.category === 'academic')} />
    </div>
  );

  const infraContent = (
    <div className="grievance__section">
      <DataTable columns={columns} data={grievancesList.filter((g) => g.category === 'infrastructure')} />
    </div>
  );

  const supportContent = (
    <div className="grievance__section">
      <GlassCard>
        <h3 className="grievance__support-title">Support Requests</h3>
        <div className="grievance__support-list">
          {grievancesList.filter((g) => g.status === 'open' || g.status === 'in-progress').map((g) => (
            <div key={g.id} className="grievance__support-item">
              <div className="grievance__support-priority">
                <div className={`grievance__priority-dot grievance__priority-dot--${g.priority}`} />
              </div>
              <div className="grievance__support-info">
                <h4>{g.title}</h4>
                <p>{g.description}</p>
                <div className="grievance__support-meta">
                  <span>Raised by: {g.raisedBy}</span>
                  <span>{g.date}</span>
                </div>
              </div>
              <Badge variant={g.status === 'open' ? 'error' : 'warning'}>{g.status}</Badge>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );

  return (
    <div className="grievance">
      <div className="grievance__header">
        <div className="grievance__header-stats">
          <div className="grievance__stat-pill">
            <AlertCircle size={16} className="grievance__stat-icon--open" />
            <span>{grievancesList.filter((g) => g.status === 'open').length} Open</span>
          </div>
          <div className="grievance__stat-pill">
            <Clock size={16} className="grievance__stat-icon--progress" />
            <span>{grievancesList.filter((g) => g.status === 'in-progress').length} In Progress</span>
          </div>
          <div className="grievance__stat-pill">
            <CheckCircle size={16} className="grievance__stat-icon--resolved" />
            <span>{grievancesList.filter((g) => g.status === 'resolved' || g.status === 'closed').length} Resolved</span>
          </div>
        </div>
        <Button icon={<Plus size={16} />} onClick={() => setShowComplaintModal(true)}>Raise Complaint</Button>
      </div>

      <Tabs
        tabs={[
          { id: 'all', label: 'All Complaints', icon: <MessageSquareWarning size={16} />, content: allContent },
          { id: 'academic', label: 'Academic', icon: <AlertCircle size={16} />, content: academicContent },
          { id: 'infrastructure', label: 'Infrastructure', icon: <Filter size={16} />, content: infraContent },
          { id: 'support', label: 'Support Requests', icon: <Clock size={16} />, content: supportContent },
        ]}
      />

      <Modal isOpen={showComplaintModal} onClose={() => setShowComplaintModal(false)} title="Raise New Complaint">
        <div className="grievance__modal-form">
          <InputField label="Title" placeholder="Brief title for the complaint" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} />
          <SelectField
            label="Category"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            options={[
              { value: 'academic', label: 'Academic' },
              { value: 'infrastructure', label: 'Infrastructure' },
              { value: 'administrative', label: 'Administrative' },
            ]}
          />
          <SelectField
            label="Priority"
            value={formData.priority}
            onChange={(e) => setFormData({...formData, priority: e.target.value})}
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />
          <div className="grievance__modal-textarea-wrapper">
            <label className="grievance__modal-label">Description</label>
            <textarea className="grievance__modal-textarea" placeholder="Describe the issue in detail..." rows={4} value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
          </div>
          <div className="grievance__modal-actions">
            <Button variant="outline" onClick={() => setShowComplaintModal(false)}>Cancel</Button>
            <Button onClick={handleCreateComplaint}>Submit Complaint</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default GrievanceHandling;
