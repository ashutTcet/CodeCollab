import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const response = await login(formData);
      const redirectPath = location.state?.from || (response.user.role === 'teacher' ? '/teacher/dashboard' : '/student/dashboard');
      navigate(redirectPath, { replace: true });
    } catch (submitError) {
      setError(submitError.message || 'Unable to log in');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Navbar />
      <main className="flex-1 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <p className="text-sm font-semibold text-brand-700 tracking-wide">CodeCollab</p>
          <h1 className="text-2xl font-bold text-slate-900 mt-3">Welcome back</h1>
          <p className="text-sm text-slate-600 mt-2">Sign in to continue your coding sessions.</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-600"
                required
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button type="submit" className="w-full btn-primary justify-center" disabled={submitting}>
              {submitting ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <p className="text-sm text-slate-600 mt-5">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="text-brand-700 font-semibold hover:text-brand-600">
              Create account
            </Link>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
