import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/SchoolAuthContext';
import GlassCard from '@/components/school/GlassCard';
import InputField from '@/components/school/InputField';
import Button from '@/components/school/Button';
import { LogIn, Sparkles } from 'lucide-react';
import './Login.css';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await login(email, password);
      const role = data?.user?.role;
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          err.response?.data?.error ||
          'Login failed. Please check your credentials.'
      );
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
          <h1>Welcome Back</h1>
          <p>Sign in to School Platform</p>
        </div>

        <form onSubmit={handleSubmit} className="login-card__form">
          {error && <div className="login-card__error">{error}</div>}
          
          <InputField
            label="Email Address"
            type="email"
            placeholder="name@institute.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <InputField
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="login-card__actions">
            <Button
              type="submit"
              className="login-card__submit"
              icon={<LogIn size={18} />}
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </Button>
          </div>

          <p className="login-card__footer">
            Don't have an account? <Link to="/register">Register here</Link>
          </p>
        </form>
      </GlassCard>
    </div>
  );
};

export default Login;
