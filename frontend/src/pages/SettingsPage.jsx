import { useState, useEffect, useRef } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useTranslationStore } from "../store/useTranslationStore";
import { axiosInstance } from "../lib/axios";
import { User, Lock, Globe, Save, Eye, EyeOff, Camera, Upload, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router";
import LanguageSelector from "../components/LanguageSelector";
import toast from "react-hot-toast";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { authUser } = useAuthStore();
  const {
    userPreferredLanguage,
    setUserPreferredLanguage,
    loadUserSettings,
    settingsLoaded
  } = useTranslationStore();

  // Profile state
  const [fullName, setFullName] = useState(authUser?.fullName || "");
  const [profilePic, setProfilePic] = useState(authUser?.profilePic || "");
  const [profilePicPreview, setProfilePicPreview] = useState(authUser?.profilePic || "");
  const fileInputRef = useRef(null);

  // Password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Translation settings state - sync with store

  // Loading states
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isUpdatingTranslation, setIsUpdatingTranslation] = useState(false);

  useEffect(() => {
    fetchUserSettings();
    // Load translation settings from database
    if (!settingsLoaded) {
      loadUserSettings();
    }
  }, [loadUserSettings, settingsLoaded]);

  const fetchUserSettings = async () => {
    try {
      const response = await axiosInstance.get("/settings/profile");
      if (response.data.success) {
        // Profile settings loaded successfully
      }
    } catch (error) {
      // Error fetching settings
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error("Image size should be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      setProfilePic(base64String);
      setProfilePicPreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      toast.error("Full name is required");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const response = await axiosInstance.put("/settings/profile", {
        fullName: fullName.trim(),
        profilePic
      });

      if (response.data.success) {
        toast.success("Profile updated successfully!");
        // Update the auth user in the store directly
        const { useAuthStore } = await import("../store/useAuthStore");
        useAuthStore.setState({
          authUser: {
            ...useAuthStore.getState().authUser,
            ...response.data.profile
          }
        });
      } else {
        toast.error(response.data.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update profile");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      toast.error("New password is required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await axiosInstance.put("/settings/password", {
        newPassword
      });

      if (response.data.success) {
        toast.success("Password updated successfully!");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        toast.error(response.data.error || "Failed to update password");
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update password");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateTranslationSettings = async (e) => {
    e.preventDefault();
    setIsUpdatingTranslation(true);

    try {
      // Update via the store's database-driven setter
      await setUserPreferredLanguage(userPreferredLanguage);

      toast.success("Translation settings updated and saved to database!");

    } catch (error) {
      toast.error(error.response?.data?.error || error.message || "Failed to update translation settings");
    } finally {
      setIsUpdatingTranslation(false);
    }
  };



  return (
    <div className="min-h-screen bg-slate-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Back Button */}
        <button
          onClick={() => {
            console.log("Back button clicked"); // Debug log
            try {
              navigate("/");
            } catch (error) {
              console.error("Navigation error:", error);
              // Fallback navigation
              window.location.href = "/";
            }
          }}
          className="mb-6 flex items-center text-slate-400 hover:text-cyan-400 transition-colors duration-200 group hover:bg-slate-800/30 px-3 py-2 rounded-lg cursor-pointer z-10 relative"
          style={{ pointerEvents: 'auto' }}
        >
          <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
          Back to Chat
        </button>

        <h1 className="text-3xl font-bold text-slate-100 mb-8 flex items-center">
          <User className="w-8 h-8 text-cyan-400 mr-3" />
          Settings
        </h1>

        <div className="space-y-8">
          {/* Profile Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <User className="w-6 h-6 text-cyan-400 mr-3" />
              <h2 className="text-xl font-semibold text-slate-100">Profile Settings</h2>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  Profile Picture
                </label>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-700 border-2 border-slate-600">
                      {profilePicPreview ? (
                        <img
                          src={profilePicPreview}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-8 h-8 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-cyan-500 hover:bg-cyan-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <Camera className="w-3 h-3 text-white" />
                    </button>
                  </div>
                  <div className="flex-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors text-sm"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload New Picture
                    </button>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-700/50 text-slate-100 placeholder-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={authUser?.email || ""}
                  disabled
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg bg-slate-700/30 text-slate-400"
                />
                <p className="text-xs text-slate-400 mt-1">Email cannot be changed</p>
              </div>

              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 text-white rounded-lg transition-colors"
              >
                <Save className="w-4 h-4 mr-2" />
                {isUpdatingProfile ? "Updating..." : "Update Profile"}
              </button>
            </form>
          </div>

          {/* Password Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Lock className="w-6 h-6 text-pink-400 mr-3" />
              <h2 className="text-xl font-semibold text-slate-100">Change Password</h2>
            </div>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-3 py-2 pr-10 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-700/50 text-slate-100 placeholder-slate-400"
                    placeholder="Enter your new password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-600 rounded-lg focus:ring-2 focus:ring-cyan-500 bg-slate-700/50 text-slate-100 placeholder-slate-400"
                  placeholder="Confirm your new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="flex items-center px-4 py-2 bg-pink-500 hover:bg-pink-600 disabled:bg-pink-400 text-white rounded-lg transition-colors"
              >
                <Lock className="w-4 h-4 mr-2" />
                {isUpdatingPassword ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>

          {/* Translation Settings */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-lg p-6">
            <div className="flex items-center mb-6">
              <Globe className="w-6 h-6 text-cyan-400 mr-3" />
              <h2 className="text-xl font-semibold text-slate-100">Translation Settings</h2>
            </div>

            <form onSubmit={handleUpdateTranslationSettings} className="space-y-6">
              {/* Preferred Language */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Preferred Language
                </label>
                <LanguageSelector
                  selectedLanguage={userPreferredLanguage}
                  onLanguageChange={setUserPreferredLanguage}
                  label="Select your preferred language for translation"
                />
                <p className="text-xs text-slate-400 mt-1">
                  This will be your default language when translating messages manually
                </p>
              </div>

              <button
                type="submit"
                disabled={isUpdatingTranslation}
                className="flex items-center px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-400 text-white rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4 mr-2" />
                {isUpdatingTranslation ? "Updating..." : "Update Translation Settings"}
              </button>
            </form>
          </div>


        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
