import React, { useState } from 'react';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { useAuth } from '../context/AuthContext';
import { googleAuthLogin } from '../lib/api';
import { Loader } from 'lucide-react';

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => { // Removed '| null' from type
    if (!credentialResponse.credential) { // No need for '?' here, as credentialResponse is guaranteed
      setError('Google login failed: No credential received.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await googleAuthLogin(credentialResponse.credential);
      const token = result.token; // Directly access token, as result is typed
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
          <div className="flex justify-center">
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
        )}

        {error && <div className="mt-6 p-3 bg-red-100 text-red-800 border-2 border-red-300 rounded-neo text-sm font-medium">{error}</div>}

        <p className="text-xs text-gray-500 mt-8">By signing in, you agree to our Terms of Service and Privacy Policy.</p>
      </div>
    </div>
  );
};

export default LoginPage;