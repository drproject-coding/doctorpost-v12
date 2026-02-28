import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { googleAuthLogin, emailRegister, emailLogin } from '../lib/api';
import { Loader, Eye, EyeOff } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setError('Google login failed: No credential received.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await googleAuthLogin(credentialResponse.credential);
      const token = result.token;
      if (!token) throw new Error('No token returned from backend');
      login(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Backend authentication failed:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.error('Google Login Failed');
    setError('Google login failed. Please try again.');
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Email and password are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = isRegistering
        ? await emailRegister(email, password)
        : await emailLogin(email, password);
      const token = result.token;
      if (!token) throw new Error('No token returned from backend');
      login(token);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Email auth failed:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-neo-grid-bg">
      <div className="neo-card p-8 w-full max-w-md text-center">
        <h1 className="text-3xl font-bold text-neo-foreground mb-6">Welcome to DoctorPost</h1>

        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader size={24} className="animate-spin mr-2 text-purple-electric" />
            <span className="text-neo-foreground font-medium">Signing in...</span>
          </div>
        ) : (
          <>
            <div className="flex justify-center mb-6">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width={280}
                text="continue_with"
                theme="filled_blue"
                size="large"
                shape="rectangular"
                logo_alignment="left"
              />
            </div>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            <form onSubmit={(e) => void handleEmailSubmit(e)} className="space-y-4">
              <div>
                <input
                  type="email"
                  className="neo-input w-full"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="neo-input w-full pr-10"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <button type="submit" className="neo-button w-full">
                {isRegistering ? 'Create Account' : 'Sign In'}
              </button>
            </form>

            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="mt-4 text-sm text-purple-electric font-medium hover:underline"
            >
              {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Register"}
            </button>
          </>
        )}

        {error && (
          <div className="mt-6 p-3 bg-red-100 text-red-800 border-2 border-red-300 rounded-neo text-sm font-medium">
            {error}
          </div>
        )}

        <p className="text-xs text-gray-500 mt-8">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
