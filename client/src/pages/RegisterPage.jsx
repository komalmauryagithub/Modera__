import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import ErrorMessage from '../components/common/ErrorMessage';
import { User, Mail, Lock, Sparkles, UserPlus } from 'lucide-react';
import '../styles/auth.css';

const RegisterPage = () => {
  const { register, loading, authError, clearError } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Full name is required.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Please provide a valid email address.';
    }

    if (!formData.password) {
      errors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
    if (formErrors[id]) {
      setFormErrors((prev) => ({ ...prev, [id]: null }));
    }
    if (authError) {
      clearError();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const result = await register(
      formData.name.trim(),
      formData.email.trim(),
      formData.password
    );

    if (result.success) {
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-tape"></div>

        <div className="auth-header">
          <div className="auth-badge">
            <Sparkles size={14} />
            <span>START YOUR STORY</span>
          </div>
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Every date deserves to be remembered</p>
        </div>

        <ErrorMessage message={authError} onDismiss={clearError} />

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <Input
            id="name"
            type="text"
            label="Your Name"
            placeholder="e.g. Komal Sharma"
            value={formData.name}
            onChange={handleChange}
            error={formErrors.name}
            icon={User}
            autoComplete="name"
            required
          />

          <Input
            id="email"
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            value={formData.email}
            onChange={handleChange}
            error={formErrors.email}
            icon={Mail}
            autoComplete="email"
            required
          />

          <Input
            id="password"
            type="password"
            label="Password"
            placeholder="At least 6 characters"
            value={formData.password}
            onChange={handleChange}
            error={formErrors.password}
            icon={Lock}
            autoComplete="new-password"
            required
          />

          <Input
            id="confirmPassword"
            type="password"
            label="Confirm Password"
            placeholder="Repeat password"
            value={formData.confirmPassword}
            onChange={handleChange}
            error={formErrors.confirmPassword}
            icon={Lock}
            autoComplete="new-password"
            required
          />

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            icon={UserPlus}
            style={{ width: '100%', marginTop: '0.75rem' }}
          >
            Create My Scrapbook
          </Button>
        </form>

        <div className="auth-footer">
          Already have an account?
          <Link to="/login" className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
