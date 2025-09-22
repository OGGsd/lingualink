import { MessageCircleIcon, Menu } from "lucide-react";

const NoConversationPlaceholder = ({ onOpenSidebar, isMobile }) => {
  return (
    <div className="flex flex-col h-full">
      {/* Mobile Header */}
      {isMobile && (
        <div className="mobile-header flex items-center justify-between p-4 border-b border-slate-700/50">
          <button
            onClick={onOpenSidebar}
            className="menu-button p-2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-slate-200 font-medium">LinguaLink</h2>
          <div className="w-9"></div> {/* Spacer for centering */}
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
        <div className="size-20 bg-cyan-500/20 rounded-full flex items-center justify-center mb-6">
          <MessageCircleIcon className="size-10 text-cyan-400" />
        </div>
        <h3 className="text-xl font-semibold text-slate-200 mb-2">Start Breaking Language Barriers</h3>
        <p className="text-slate-400 max-w-md mb-4">
          Choose a contact to start messaging with real-time translation. Communicate seamlessly across languages with Lingua Link.
        </p>
        {isMobile && (
          <button
            onClick={onOpenSidebar}
            className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            Browse Contacts
          </button>
        )}
      </div>
    </div>
  );
};

export default NoConversationPlaceholder;
