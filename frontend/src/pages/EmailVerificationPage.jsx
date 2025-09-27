import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { 
  MessageCircleIcon, 
  MailIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  LoaderIcon,
  RefreshCwIcon 
} from "lucide-react";
import toast from "react-hot-toast";

function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuthStore();
  
  const [verificationState, setVerificationState] = useState({
    status: 'verifying', // 'verifying', 'success', 'error', 'expired'
    message: '',
    isResending: false
  });

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      handleVerification(token);
    } else {
      // Check if user just signed up and needs to verify
      const pendingEmail = localStorage.getItem('pendingVerificationEmail');
      if (pendingEmail) {
        setVerificationState({
          status: 'pending',
          message: 'Verification email sent! Please check your inbox and spam folder.',
          isResending: false
        });
      } else {
        setVerificationState({
          status: 'error',
          message: 'Invalid verification link. Please check your email for the correct link.',
          isResending: false
        });
      }
    }
  }, [token]);

  const handleVerification = async (verificationToken) => {
    try {
      setVerificationState(prev => ({ ...prev, status: 'verifying' }));
      
      const result = await verifyEmail(verificationToken);
      
      if (result.success) {
        setVerificationState({
          status: 'success',
          message: 'Email verified successfully! You can now sign in to your account.',
          isResending: false
        });
        
        toast.success('Email verified successfully!');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setVerificationState({
          status: 'error',
          message: result.message || 'Verification failed. The link may be expired or invalid.',
          isResending: false
        });
      }
    } catch (error) {
      setVerificationState({
        status: 'error',
        message: 'Verification failed. The link may be expired or invalid.',
        isResending: false
      });
    }
  };

  const handleResendVerification = async () => {
    const email = localStorage.getItem('pendingVerificationEmail');
    
    if (!email) {
      toast.error('No email found. Please sign up again.');
      navigate('/signup');
      return;
    }

    try {
      setVerificationState(prev => ({ ...prev, isResending: true }));
      
      const result = await resendVerification(email);
      
      if (result.success) {
        toast.success('Verification email sent! Please check your inbox.');
        setVerificationState(prev => ({ 
          ...prev, 
          isResending: false,
          message: 'New verification email sent! Please check your inbox and spam folder.'
        }));
      } else {
        toast.error(result.message || 'Failed to resend verification email');
        setVerificationState(prev => ({ ...prev, isResending: false }));
      }
    } catch (error) {
      toast.error('Failed to resend verification email');
      setVerificationState(prev => ({ ...prev, isResending: false }));
    }
  };

  const getStatusIcon = () => {
    switch (verificationState.status) {
      case 'verifying':
        return <LoaderIcon className="w-16 h-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="w-16 h-16 text-green-500" />;
      case 'pending':
        return <MailIcon className="w-16 h-16 text-blue-500" />;
      case 'error':
        return <XCircleIcon className="w-16 h-16 text-red-500" />;
      default:
        return <MailIcon className="w-16 h-16 text-slate-400" />;
    }
  };

  const getStatusColor = () => {
    switch (verificationState.status) {
      case 'verifying':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'pending':
        return 'text-blue-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusTitle = () => {
    switch (verificationState.status) {
      case 'verifying':
        return 'Verifying Your Email...';
      case 'success':
        return 'Email Verified Successfully!';
      case 'pending':
        return 'Please Verify Your Email';
      case 'error':
        return 'Verification Failed';
      default:
        return 'Email Verification';
    }
  };

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-900 min-h-screen">
      <div className="relative w-full max-w-4xl">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col items-center justify-center p-8 min-h-[500px]">
            {/* LOGO */}
            <div className="text-center mb-8">
              <MessageCircleIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
              <h1 className="text-3xl font-bold text-slate-200 mb-2">LinguaLink</h1>
              <p className="text-slate-400">Breaking language barriers with AI</p>
            </div>

            {/* STATUS ICON */}
            <div className="mb-6">
              {getStatusIcon()}
            </div>

            {/* STATUS TITLE */}
            <h2 className={`text-2xl font-bold mb-4 ${getStatusColor()}`}>
              {getStatusTitle()}
            </h2>

            {/* STATUS MESSAGE */}
            <p className="text-slate-300 text-center mb-8 max-w-md">
              {verificationState.message}
            </p>

            {/* ACTION BUTTONS */}
            <div className="flex flex-col gap-4 w-full max-w-sm">
              {verificationState.status === 'success' && (
                <Link 
                  to="/login" 
                  className="auth-btn text-center"
                >
                  Continue to Sign In
                </Link>
              )}

              {verificationState.status === 'error' && (
                <>
                  <button
                    onClick={handleResendVerification}
                    disabled={verificationState.isResending}
                    className="auth-btn flex items-center justify-center gap-2"
                  >
                    {verificationState.isResending ? (
                      <LoaderIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <RefreshCwIcon className="w-5 h-5" />
                    )}
                    {verificationState.isResending ? 'Sending...' : 'Resend Verification Email'}
                  </button>
                  
                  <Link 
                    to="/signup" 
                    className="auth-link text-center"
                  >
                    Back to Sign Up
                  </Link>
                </>
              )}

              {verificationState.status === 'verifying' && (
                <div className="text-center">
                  <p className="text-slate-400 text-sm">
                    Please wait while we verify your email address...
                  </p>
                </div>
              )}
            </div>

            {/* HELP TEXT */}
            <div className="mt-8 text-center">
              <p className="text-slate-500 text-sm">
                Need help? Contact us at{' '}
                <a href="mailto:support@lingualink.tech" className="text-blue-400 hover:text-blue-300">
                  support@lingualink.tech
                </a>
              </p>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default EmailVerificationPage;
