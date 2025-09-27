import { useState } from "react";
import { Link } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { 
  MessageCircleIcon, 
  MailIcon, 
  LoaderIcon,
  ArrowLeftIcon,
  CheckCircleIcon
} from "lucide-react";

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { forgotPassword, isLoading } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      return;
    }

    try {
      const result = await forgotPassword(email);
      
      if (result.success) {
        setIsSubmitted(true);
      }
    } catch (error) {
      // Error handling is done in the store
    }
  };

  if (isSubmitted) {
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

              {/* SUCCESS ICON */}
              <div className="mb-6">
                <CheckCircleIcon className="w-16 h-16 text-green-500" />
              </div>

              {/* SUCCESS MESSAGE */}
              <h2 className="text-2xl font-bold text-green-500 mb-4">
                Check Your Email
              </h2>

              <p className="text-slate-300 text-center mb-8 max-w-md">
                If an account with <strong>{email}</strong> exists, we've sent you a password reset link. 
                Please check your inbox and spam folder.
              </p>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-4 w-full max-w-sm">
                <Link 
                  to="/login" 
                  className="auth-btn text-center"
                >
                  Back to Sign In
                </Link>
                
                <button
                  onClick={() => setIsSubmitted(false)}
                  className="auth-link text-center"
                >
                  Try Different Email
                </button>
              </div>

              {/* HELP TEXT */}
              <div className="mt-8 text-center">
                <p className="text-slate-500 text-sm">
                  Didn't receive the email? Check your spam folder or{' '}
                  <a href="mailto:support@lingualink.app" className="text-blue-400 hover:text-blue-300">
                    contact support
                  </a>
                </p>
              </div>
            </div>
          </BorderAnimatedContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-900 min-h-screen">
      <div className="relative w-full max-w-6xl md:h-[700px] h-[600px]">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row">
            {/* FORM COLUMN - LEFT SIDE */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-slate-600/30">
              <div className="w-full max-w-md">
                {/* BACK BUTTON */}
                <Link 
                  to="/login" 
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 mb-6 transition-colors"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  Back to Sign In
                </Link>

                {/* HEADING TEXT */}
                <div className="text-center mb-8">
                  <MessageCircleIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h2 className="text-2xl font-bold text-slate-200 mb-2">Forgot Password?</h2>
                  <p className="text-slate-400">No worries! Enter your email and we'll send you a reset link.</p>
                </div>

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* EMAIL INPUT */}
                  <div>
                    <label className="auth-input-label">Email Address</label>
                    <div className="relative">
                      <MailIcon className="auth-input-icon" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="input"
                        placeholder="Enter your email address"
                        required
                      />
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button 
                    className="auth-btn" 
                    type="submit" 
                    disabled={isLoading || !email.trim()}
                  >
                    {isLoading ? (
                      <LoaderIcon className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Send Reset Link"
                    )}
                  </button>
                </form>

                {/* ADDITIONAL LINKS */}
                <div className="mt-6 text-center space-y-2">
                  <Link to="/login" className="auth-link block">
                    Remember your password? Sign In
                  </Link>
                  <Link to="/signup" className="auth-link block">
                    Don't have an account? Sign Up
                  </Link>
                </div>
              </div>
            </div>

            {/* INFO COLUMN - RIGHT SIDE */}
            <div className="md:w-1/2 p-8 flex items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                    <MailIcon className="w-10 h-10 text-white" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-slate-200 mb-4">
                  Secure Password Reset
                </h3>
                
                <p className="text-slate-400 mb-6">
                  We'll send you a secure link to reset your password. The link will expire in 1 hour for your security.
                </p>

                <div className="space-y-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Secure encrypted email delivery</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>One-time use reset links</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Automatic expiration for security</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BorderAnimatedContainer>
      </div>
    </div>
  );
}

export default ForgotPasswordPage;
