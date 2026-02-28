import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext.jsx';
import { googleAuthLogin, emailRegister, emailLogin } from '../lib/api.jsx'; // Updated import
import { Loader, Eye, EyeOff } from 'lucide-react'; // Import Eye and EyeOff icons

const LoginPage = () => {
  const { login, guestLogin } = useAuth(); // Destructure guestLogin
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // New state for password visibility

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      setError('Google login failed: No credential received.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await googleAuthLogin(credentialResponse.credential);
      const token = result?.token ?? null;
      if (!token) throw new Error('No token returned from backend');
      login(token);
    } catch (err) {
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

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let result;
      if (isRegistering) {
        result = await emailRegister(email, password);
      } else {
        result = await emailLogin(email, password);
      }
      
      const token = result?.token ?? null;
      if (!token) throw new Error('No token returned from backend');
      login(token);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error('Email authentication failed:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    guestLogin();
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
            {!showEmailForm ? (
              <>
                <div className="flex justify-center mb-4">
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
                <button
                  onClick={() => setShowEmailForm(true)}
                  className="neo-button secondary w-full mt-4"
                >
                  {isRegistering ? 'Register with Email' : 'Sign In with Email'}
                </button>
                <button
                  onClick={handleGuestLogin} // New Guest Login Button
                  className="neo-button secondary w-full mt-4"
                >
                  Continue as Guest
                </button>
              </>
            ) : (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="neo-label text-left">Email</label>
                  <input
                    type="email"
                    id="email"
                    className="neo-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="password" className="neo-label text-left">Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'} // Toggle type based on state
                      id="password"
                      className="neo-input pr-10" // Add padding for the icon
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  className="neo-button w-full"
                  disabled={loading}
                >
                  {isRegistering ? 'Create Account' : 'Sign In'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="neo-button secondary w-full mt-2"
                >
                  {isRegistering ? 'Already have an account? Sign In' : 'Need an account? Register'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEmailForm(false)}
                  className="neo-button secondary w-full mt-2"
                >
                  Back to Google Login
                </button>
              </form>
            )}
          </>
        )}

        {error && <div className="mt-6 p-3 bg-red-100 text-red-800 border-2 border-red-300 rounded-neo text-sm font-medium">{error}</div>}

        <p className="text-xs text-gray-500 mt-8">By signing in, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
};

export default LoginPage;