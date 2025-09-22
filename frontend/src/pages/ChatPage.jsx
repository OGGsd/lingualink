import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { useChatStore } from "../store/useChatStore";

import BorderAnimatedContainer from "../components/BorderAnimatedContainer";
import ProfileHeader from "../components/ProfileHeader";
import ActiveTabSwitch from "../components/ActiveTabSwitch";
import UniversalSearch from "../components/UniversalSearch";
import ChatsList from "../components/ChatsList";
import ContactList from "../components/ContactList";
import ChatContainer from "../components/ChatContainer";
import NoConversationPlaceholder from "../components/NoConversationPlaceholder";

function ChatPage() {
  const { activeTab, selectedUser } = useChatStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close sidebar when user is selected on mobile
  useEffect(() => {
    if (selectedUser && isMobile) {
      setIsSidebarOpen(false);
    }
  }, [selectedUser, isMobile]);

  // Close sidebar when clicking outside on mobile
  const handleOverlayClick = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="relative w-full max-w-6xl h-[800px]">
      <BorderAnimatedContainer>
        {/* Mobile Menu Button */}
        {isMobile && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="menu-button absolute top-4 left-4 z-50 p-2 bg-slate-800/80 backdrop-blur-sm rounded-lg text-slate-200 hover:text-cyan-400 transition-colors md:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        {/* Mobile Overlay */}
        {isMobile && isSidebarOpen && (
          <div
            className="mobile-overlay fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
            onClick={handleOverlayClick}
          />
        )}

        {/* LEFT SIDE - Sidebar */}
        <div className={`
          ${isMobile
            ? `fixed inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out ${
                isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
              }`
            : 'w-80'
          }
          bg-slate-800/50 backdrop-blur-sm flex flex-col
        `}>
          {/* Mobile Close Button */}
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-200 transition-colors md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          <ProfileHeader />
          <ActiveTabSwitch />
          <UniversalSearch />

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {activeTab === "chats" ? <ChatsList /> : <ContactList />}
          </div>
        </div>

        {/* RIGHT SIDE - Chat Area */}
        <div className={`
          flex-1 flex flex-col bg-slate-900/50 backdrop-blur-sm
          ${isMobile ? 'w-full' : ''}
        `}>
          {selectedUser ? (
            <ChatContainer onOpenSidebar={() => setIsSidebarOpen(true)} />
          ) : (
            <NoConversationPlaceholder
              onOpenSidebar={() => setIsSidebarOpen(true)}
              isMobile={isMobile}
            />
          )}
        </div>
      </BorderAnimatedContainer>
    </div>
  );
}
export default ChatPage;
