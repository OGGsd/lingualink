import { useState, useEffect, useRef } from "react";
import { Search, X, User, MessageCircle, Users } from "lucide-react";
import { useChatStore } from "../store/useChatStore";
import { useAuthStore } from "../store/useAuthStore";

function UniversalSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  
  const { allContacts, chats, setSelectedUser, setActiveTab } = useChatStore();
  const { onlineUsers } = useAuthStore();

  // Debounced search function
  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(() => {
      performSearch(searchTerm);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, allContacts, chats]);

  const performSearch = (query) => {
    const lowerQuery = query.toLowerCase();
    const results = [];

    // Search through chats
    chats.forEach(chat => {
      if (chat.fullName.toLowerCase().includes(lowerQuery)) {
        results.push({
          ...chat,
          type: 'chat',
          isOnline: onlineUsers.includes(String(chat._id))
        });
      }
    });

    // Search through contacts
    allContacts.forEach(contact => {
      // Avoid duplicates (user might be in both chats and contacts)
      const alreadyInResults = results.some(result => result._id === contact._id);
      if (!alreadyInResults && contact.fullName.toLowerCase().includes(lowerQuery)) {
        results.push({
          ...contact,
          type: 'contact',
          isOnline: onlineUsers.includes(String(contact._id))
        });
      }
    });

    setSearchResults(results);
  };

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSearchTerm("");
    setIsSearchActive(false);
    
    // Switch to appropriate tab based on user type
    if (user.type === 'chat') {
      setActiveTab('chats');
    } else {
      setActiveTab('contacts');
    }
  };

  const handleClearSearch = () => {
    setSearchTerm("");
    setIsSearchActive(false);
    setSearchResults([]);
  };

  const handleFocus = () => {
    setIsSearchActive(true);
  };

  const handleBlur = (e) => {
    // Only close if clicking outside the search container
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setTimeout(() => setIsSearchActive(false), 150);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + K to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchActive(true);
      }
      
      // Escape to clear search
      if (e.key === 'Escape' && isSearchActive) {
        handleClearSearch();
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isSearchActive]);

  return (
    <div className="relative px-4 py-3 border-b border-slate-700/50">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" />
        </div>
        
        <input
          ref={searchInputRef}
          type="text"
          placeholder="Search chats and contacts... (Ctrl+K)"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="search-input w-full pl-10 pr-10 py-2.5 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
        />
        
        {searchTerm && (
          <button
            onClick={handleClearSearch}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isSearchActive && (searchTerm || searchResults.length > 0) && (
        <div className="search-dropdown absolute top-full left-4 right-4 mt-1 bg-slate-800/95 backdrop-blur-sm border border-slate-700/50 rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center">
              <div className="inline-flex items-center gap-2 text-slate-400">
                <div className="search-spinner w-4 h-4 border-2 border-cyan-500/30 border-t-cyan-500 rounded-full"></div>
                Searching...
              </div>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="py-2">
              {searchResults.map((user) => (
                <button
                  key={`${user.type}-${user._id}`}
                  onClick={() => handleSelectUser(user)}
                  className="search-result-item w-full px-4 py-3 text-left hover:bg-slate-700/50 transition-colors flex items-center gap-3 group"
                >
                  {/* Avatar */}
                  <div className={`avatar ${user.isOnline ? "online" : "offline"}`}>
                    <div className="w-10 h-10 rounded-full">
                      <img 
                        src={user.profilePic || "/avatar.png"} 
                        alt={user.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                  
                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-slate-200 font-medium truncate group-hover:text-cyan-400 transition-colors">
                        {user.fullName}
                      </h4>
                      <div className="flex items-center gap-1">
                        {user.type === 'chat' ? (
                          <MessageCircle className="w-3 h-3 text-cyan-400" />
                        ) : (
                          <Users className="w-3 h-3 text-slate-400" />
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400">
                      {user.isOnline ? "Online" : "Offline"} • {user.type === 'chat' ? 'Recent chat' : 'Contact'}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          ) : searchTerm ? (
            <div className="p-4 text-center text-slate-400">
              <User className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No users found for "{searchTerm}"</p>
              <p className="text-xs mt-1 opacity-75">Try searching with a different name</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

export default UniversalSearch;
