import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router";
import { useAuthStore } from "../store/useAuthStore";
import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import { 
  MessageCircleIcon, 
  LockIcon, 
  LoaderIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  EyeOffIcon
} from "lucide-react";

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuthStore();
  
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation
    if (!formData.password || !formData.confirmPassword) {
      setError("Please fill in all fields");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!token) {
      setError("Invalid reset token");
      return;
    }

    try {
      const result = await resetPassword(token, formData.password);
      
      if (result.success) {
        setIsSuccess(true);
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(result.message || "Failed to reset password. The link may be expired.");
      }
    } catch (error) {
      setError("Failed to reset password. Please try again.");
    }
  };

  if (isSuccess) {
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
                Password Reset Successfully!
              </h2>

              <p className="text-slate-300 text-center mb-8 max-w-md">
                Your password has been updated successfully. You can now sign in with your new password.
              </p>

              {/* ACTION BUTTON */}
              <Link 
                to="/login" 
                className="auth-btn text-center"
              >
                Continue to Sign In
              </Link>
            </div>
          </BorderAnimatedContainer>
        </div>
      </div>
    );
  }

  if (error && !token) {
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

              {/* ERROR ICON */}
              <div className="mb-6">
                <XCircleIcon className="w-16 h-16 text-red-500" />
              </div>

              {/* ERROR MESSAGE */}
              <h2 className="text-2xl font-bold text-red-500 mb-4">
                Invalid Reset Link
              </h2>

              <p className="text-slate-300 text-center mb-8 max-w-md">
                This password reset link is invalid or has expired. Please request a new password reset.
              </p>

              {/* ACTION BUTTONS */}
              <div className="flex flex-col gap-4 w-full max-w-sm">
                <Link 
                  to="/forgot-password" 
                  className="auth-btn text-center"
                >
                  Request New Reset Link
                </Link>
                
                <Link 
                  to="/login" 
                  className="auth-link text-center"
                >
                  Back to Sign In
                </Link>
              </div>
            </div>
          </BorderAnimatedContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center p-4 bg-slate-900 min-h-screen">
      <div className="relative w-full max-w-6xl md:h-[700px] h-[650px]">
        <BorderAnimatedContainer>
          <div className="w-full flex flex-col md:flex-row">
            {/* FORM COLUMN - LEFT SIDE */}
            <div className="md:w-1/2 p-8 flex items-center justify-center md:border-r border-slate-600/30">
              <div className="w-full max-w-md">
                {/* HEADING TEXT */}
                <div className="text-center mb-8">
                  <MessageCircleIcon className="w-12 h-12 mx-auto text-slate-400 mb-4" />
                  <h2 className="text-2xl font-bold text-slate-200 mb-2">Reset Your Password</h2>
                  <p className="text-slate-400">Enter your new password below</p>
                </div>

                {/* ERROR MESSAGE */}
                {error && (
                  <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* FORM */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* NEW PASSWORD INPUT */}
                  <div>
                    <label className="auth-input-label">New Password</label>
                    <div className="relative">
                      <LockIcon className="auth-input-icon" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="input pr-12"
                        placeholder="Enter new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* CONFIRM PASSWORD INPUT */}
                  <div>
                    <label className="auth-input-label">Confirm New Password</label>
                    <div className="relative">
                      <LockIcon className="auth-input-icon" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="input pr-12"
                        placeholder="Confirm new password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                      >
                        {showConfirmPassword ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {/* SUBMIT BUTTON */}
                  <button 
                    className="auth-btn" 
                    type="submit" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <LoaderIcon className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>

                {/* ADDITIONAL LINKS */}
                <div className="mt-6 text-center">
                  <Link to="/login" className="auth-link">
                    Back to Sign In
                  </Link>
                </div>
              </div>
            </div>

            {/* INFO COLUMN - RIGHT SIDE */}
            <div className="md:w-1/2 p-8 flex items-center justify-center bg-gradient-to-br from-slate-800/50 to-slate-900/50">
              <div className="text-center max-w-md">
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto bg-gradient-to-r from-green-500 to-blue-600 rounded-full flex items-center justify-center mb-4">
                    <LockIcon className="w-10 h-10 text-white" />
                  </div>
                </div>
                
                <h3 className="text-xl font-semibold text-slate-200 mb-4">
                  Create a Strong Password
                </h3>
                
                <p className="text-slate-400 mb-6">
                  Choose a secure password to protect your LinguaLink account and keep your conversations safe.
                </p>

                <div className="space-y-3 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>At least 6 characters long</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Mix of letters and numbers</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Avoid common passwords</span>
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

export default ResetPasswordPage;
