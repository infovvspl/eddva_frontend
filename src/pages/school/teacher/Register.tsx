import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import GlassCard from '@/components/school/GlassCard';
import InputField from '@/components/school/InputField';
import SelectField from '@/components/school/SelectField';
import Button from '@/components/school/Button';
import { UserPlus, Sparkles } from 'lucide-react';
import './Login.css';

const Register: React.FC = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(formData);
      alert('Registered Successfully');
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-page__bg">
        <div className="login-page__blob login-page__blob--1" />
        <div className="login-page__blob login-page__blob--2" />
        <div className="login-page__blob login-page__blob--3" />
      </div>
      
      <GlassCard className="login-card">
        <div className="login-card__header">
          <div className="login-card__logo">
            <Sparkles size={32} color="var(--primary)" />
          </div>
          <h1>Join Us</h1>
          <p>Create your Teacher Module account</p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          {error && <div className="login-card__error">{error}</div>}
          
          <InputField
            label="Full Name"
            placeholder="John Doe"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <InputField
            label="Email Address"
            type="email"
            placeholder="name@institute.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <SelectField
            label="Your Role"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            options={[
              { value: 'student', label: 'Student' },
              { value: 'teacher', label: 'Teacher' },
              { value: 'parent', label: 'Parent' },
              { value: 'institute_admin', label: 'Institute Admin' },
            ]}
            required
          />

          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
          />

          <div className="login-card__actions">
            <Button
              type="submit"
              className="login-card__submit"
              icon={<UserPlus size={18} />}
              disabled={loading}
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </Button>
          </div>

          <p className="login-card__footer">
            Already have an account? <Link to="/login">Login here</Link>
          </p>
        </form>
      </GlassCard>
    </div>
  );
};

export default Register;
