import React, { useState } from 'react';
import { useChat } from '../../context/chat-context';
import { Logo } from '../logo/Logo';
import { ProfileModal } from '../profile-modal/ProfileModal';
import { UsageModal } from '../usage-modal/UsageModal';
import { BASE_URL } from '../../../data/datasources/chat-api-datasource';
import './Sidebar.css';

export const Sidebar: React.FC = () => {
  const {
    chats,
    activeChat,
    startNewChat,
    selectChat,
    deleteChat,
    user,
    loginWithGoogle,
    logout,
    isSidebarOpen,
    setSidebarOpen,
    setAuthModalOpen,
    pinChat,
    archiveChat,
    showArchived,
    setShowArchived,
  } = useChat();

  const [isProfileOpen, setProfileOpen] = useState(false);
  const [isUsageOpen, setUsageOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<'all' | 'openai' | 'gemini' | 'claude'>('all');

  const [folders, setFolders] = useState<string[]>(() => {
    if (typeof window === 'undefined') return ['Projects', 'Archive', 'Drafts'];
    const saved = localStorage.getItem('garionx_chat_folders');
    return saved ? JSON.parse(saved) : ['Projects', 'Archive', 'Drafts'];
  });
  
  const [collapsedFolders, setCollapsedFolders] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    const saved = localStorage.getItem('garionx_collapsed_folders');
    return saved ? JSON.parse(saved) : [];
  });

  const [chatFolderMap, setChatFolderMap] = useState<Record<string, string>>(() => {
    if (typeof window === 'undefined') return {};
    const saved = localStorage.getItem('garionx_chat_folder_mapping');
    return saved ? JSON.parse(saved) : {};
  });

  const [movingChatId, setMovingChatId] = useState<string | null>(null);

  const createFolder = () => {
    const name = prompt('Enter new folder name:');
    if (!name) return;
    const cleanName = name.trim();
    if (!cleanName) return;
    if (folders.includes(cleanName)) {
      alert('Folder already exists!');
      return;
    }
    const updated = [...folders, cleanName];
    setFolders(updated);
    localStorage.setItem('garionx_chat_folders', JSON.stringify(updated));
  };

  const deleteFolder = (folderName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete folder "${folderName}"? Chats inside will be uncategorized.`)) return;
    const updatedFolders = folders.filter(f => f !== folderName);
    setFolders(updatedFolders);
    localStorage.setItem('garionx_chat_folders', JSON.stringify(updatedFolders));

    const updatedMap = { ...chatFolderMap };
    Object.keys(updatedMap).forEach(chatId => {
      if (updatedMap[chatId] === folderName) {
        delete updatedMap[chatId];
      }
    });
    setChatFolderMap(updatedMap);
    localStorage.setItem('garionx_chat_folder_mapping', JSON.stringify(updatedMap));
  };

  const toggleFolderCollapse = (folderName: string) => {
    const isCollapsed = collapsedFolders.includes(folderName);
    const updated = isCollapsed 
      ? collapsedFolders.filter(f => f !== folderName)
      : [...collapsedFolders, folderName];
    setCollapsedFolders(updated);
    localStorage.setItem('garionx_collapsed_folders', JSON.stringify(updated));
  };

  const moveChatToFolder = (chatId: string, folderName: string | null) => {
    const updated = { ...chatFolderMap };
    if (folderName === null) {
      delete updated[chatId];
    } else {
      updated[chatId] = folderName;
    }
    setChatFolderMap(updated);
    localStorage.setItem('garionx_chat_folder_mapping', JSON.stringify(updated));
    setMovingChatId(null);
  };

  const renderChatItem = (chat: any) => {
    const isActive = activeChat?.id === chat.id;
    return (
      <div
        key={chat.id}
        className={`chat-item-wrapper ${isActive ? 'active' : ''} ${chat.isPinned ? 'pinned' : ''}`}
      >
        <button
          className="chat-item-btn"
          onClick={() => selectChat(chat.id)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chat-icon">
            {chat.isPinned ? (
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" opacity="0.8" />
            ) : (
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            )}
          </svg>
          <span className="chat-title">{chat.title}</span>
        </button>

        <div className="chat-actions-group">
          {/* Move to folder trigger */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <button
              className="folder-assign-btn"
              onClick={(e) => {
                e.stopPropagation();
                setMovingChatId(movingChatId === chat.id ? null : chat.id);
              }}
              title="Move to Folder"
              style={{
                background: 'transparent',
                border: 'none',
                color: chatFolderMap[chat.id] ? '#00ffcc' : 'var(--text-secondary)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0.7,
                transition: 'opacity 0.2s'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
              </svg>
            </button>
            {movingChatId === chat.id && (
              <div className="folder-select-menu glass-panel" style={{
                position: 'absolute',
                bottom: '100%',
                right: 0,
                backgroundColor: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: '6px',
                padding: '6px',
                zIndex: 150,
                width: '150px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
              }}>
                <span style={{ fontSize: '0.62rem', color: 'var(--text-muted)', padding: '2px 4px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'block', textAlign: 'left', fontWeight: 700 }}>
                  MOVE TO FOLDER:
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); moveChatToFolder(chat.id, null); }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: !chatFolderMap[chat.id] ? '#00ffcc' : 'var(--text-secondary)',
                    fontSize: '0.72rem',
                    padding: '6px',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderRadius: '4px',
                    backgroundColor: !chatFolderMap[chat.id] ? 'rgba(0, 255, 204, 0.05)' : 'transparent'
                  }}
                >
                  Uncategorized
                </button>
                {folders.map(f => (
                  <button
                    key={f}
                    onClick={(e) => { e.stopPropagation(); moveChatToFolder(chat.id, f); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: chatFolderMap[chat.id] === f ? '#00ffcc' : 'var(--text-secondary)',
                      fontSize: '0.72rem',
                      padding: '6px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      borderRadius: '4px',
                      backgroundColor: chatFolderMap[chat.id] === f ? 'rgba(0, 255, 204, 0.05)' : 'transparent'
                    }}
                  >
                    📁 {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pin button */}
          <button
            className={`pin-chat-btn ${chat.isPinned ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              pinChat(chat.id);
            }}
            title={chat.isPinned ? "Unpin Chat" : "Pin Chat"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="17" x2="12" y2="22"></line>
              <path d="M5 17h14v-1.76a2 2 0 0 0-.44-1.24l-2.78-3.47A2 2 0 0 1 15 9.29V5a3 3 0 0 0-6 0v4.29a2 2 0 0 1-.78 1.24l-2.78 3.47A2 2 0 0 0 5 15.24z"></path>
            </svg>
          </button>

          {/* Archive button */}
          <button
            className={`archive-chat-btn ${chat.isArchived ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              archiveChat(chat.id);
            }}
            title={chat.isArchived ? "Unarchive Chat" : "Archive Chat"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="21 8 21 21 3 21 3 8"></polyline>
              <rect x="1" y="3" width="22" height="5"></rect>
              <line x1="10" y1="12" x2="14" y2="12"></line>
            </svg>
          </button>

          {/* Delete button */}
          <button
            className="delete-chat-btn"
            onClick={(e) => {
              e.stopPropagation();
              deleteChat(chat.id);
            }}
            title="Delete Chat"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  const avatarUrl = user && user.avatarUrl
    ? (user.avatarUrl.startsWith('/') ? `${BASE_URL}${user.avatarUrl}` : user.avatarUrl)
    : `https://api.dicebear.com/7.x/bottts/svg?seed=avatar`;

  // Filter chats by search, selected model pill, and archive state
  const filteredChats = chats.filter((chat) => {
    const matchesSearch = chat.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesModel = modelFilter === 'all' || (chat.model || 'openai').toLowerCase() === modelFilter;
    const matchesArchive = showArchived ? chat.isArchived === true : !chat.isArchived;
    return matchesSearch && matchesModel && matchesArchive;
  });

  return (
    <aside className={`sidebar glass-panel ${isSidebarOpen ? 'open' : 'closed'}`}>
      {/* Top Header */}
      <div className="sidebar-header">
        <div className="brand-logo" onClick={startNewChat}>
          <Logo size="sm" />
          <span className="brand-name">GarionX</span>
        </div>
        {/* Toggle Button for mobile */}
        <button className="close-btn" onClick={() => setSidebarOpen(false)} title="Collapse Sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>

      {/* New Chat + Usage Buttons */}
      <div className="new-chat-container">
        <button className="new-chat-btn glow-effect" onClick={startNewChat}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          <span>New Chat</span>
        </button>
        <button
          className="usage-btn"
          onClick={() => setUsageOpen(true)}
          title="Token Usage Monitor"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 20V10M12 20V4M6 20v-6" />
          </svg>
        </button>
      </div>

      {/* Search & Filter Component */}
      <div className="search-filter-container">
        <div className="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="search-icon">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')} title="Clear Search">
              &times;
            </button>
          )}
        </div>
        <div className="filter-pills">
          <button 
            className={`filter-pill ${modelFilter === 'all' ? 'active' : ''}`}
            onClick={() => setModelFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-pill ${modelFilter === 'openai' ? 'active' : ''}`}
            onClick={() => setModelFilter('openai')}
          >
            OpenAI
          </button>
          <button 
            className={`filter-pill ${modelFilter === 'gemini' ? 'active' : ''}`}
            onClick={() => setModelFilter('gemini')}
          >
            Gemini
          </button>
          <button 
            className={`filter-pill ${modelFilter === 'claude' ? 'active' : ''}`}
            onClick={() => setModelFilter('claude')}
          >
            Claude
          </button>
        </div>
      </div>
      {/* Chat History List */}
      <div className="chat-history-container">
        <div className="section-title-wrapper" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 8px 8px 12px' }}>
          <span className="section-title" style={{ paddingLeft: 0, marginBottom: 0 }}>
            {showArchived ? 'Archived Chats' : (searchQuery || modelFilter !== 'all' ? 'Filtered Chats' : 'Recent Chats')}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* New Folder Button */}
            {!showArchived && !searchQuery && modelFilter === 'all' && (
              <button
                type="button"
                onClick={createFolder}
                title="Create New Folder"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                  transition: 'color 0.2s'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  <line x1="12" y1="11" x2="12" y2="17"></line>
                  <line x1="9" y1="14" x2="15" y2="14"></line>
                </svg>
              </button>
            )}
            
            <button
              type="button"
              className={`archive-toggle-btn ${showArchived ? 'active' : ''}`}
              onClick={() => setShowArchived(!showArchived)}
              title={showArchived ? "Show Active Chats" : "Show Archived Chats"}
              style={{ 
                background: 'transparent', 
                border: 'none', 
                color: showArchived ? '#00d9ff' : '#64748b', 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                fontSize: '0.72rem', 
                fontWeight: 700, 
                gap: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="21 8 21 21 3 21 3 8"></polyline>
                <rect x="1" y="3" width="22" height="5"></rect>
              </svg>
              <span>{showArchived ? "Active" : "Archived"}</span>
            </button>
          </div>
        </div>
        <div className="chats-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredChats.length === 0 ? (
            <div className="empty-chats">
              {chats.length === 0 ? 'No chat histories yet' : 'No matching chats found'}
            </div>
          ) : (
            (() => {
              // Group chats by folder
              const chatsByFolder: Record<string, typeof filteredChats> = {};
              const unassignedChats: typeof filteredChats = [];

              filteredChats.forEach(chat => {
                const folderName = chatFolderMap[chat.id];
                if (folderName && folders.includes(folderName)) {
                  if (!chatsByFolder[folderName]) {
                    chatsByFolder[folderName] = [];
                  }
                  chatsByFolder[folderName].push(chat);
                } else {
                  unassignedChats.push(chat);
                }
              });

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  
                  {/* Render Folder Groups */}
                  {!showArchived && !searchQuery && modelFilter === 'all' && folders.map(folderName => {
                    const folderChats = chatsByFolder[folderName] || [];
                    const isCollapsed = collapsedFolders.includes(folderName);

                    return (
                      <div key={folderName} className="folder-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div
                          className="folder-header-row"
                          onClick={() => toggleFolderCollapse(folderName)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: 'var(--border-radius-md)',
                            backgroundColor: 'rgba(255,255,255,0.02)',
                            border: '1px solid rgba(255,255,255,0.03)',
                            cursor: 'pointer',
                            userSelect: 'none',
                            transition: 'var(--transition-smooth)'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '0.65rem', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0)', transition: 'transform 0.2s', display: 'inline-block' }}>▼</span>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-secondary)" strokeWidth="2.5">
                              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                            </svg>
                            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{folderName}</span>
                            <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>({folderChats.length})</span>
                          </div>
                          
                          <button
                            onClick={(e) => deleteFolder(folderName, e)}
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'rgba(239, 68, 68, 0.6)',
                              fontSize: '0.8rem',
                              cursor: 'pointer',
                              padding: '2px'
                            }}
                            title="Delete Folder"
                          >
                            &times;
                          </button>
                        </div>

                        {!isCollapsed && (
                          <div className="folder-contents" style={{ paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '2px', borderLeft: '1px dashed rgba(255,255,255,0.05)', marginLeft: '14px' }}>
                            {folderChats.length === 0 ? (
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '6px 8px', fontStyle: 'italic' }}>
                                Folder is empty
                              </div>
                            ) : (
                              folderChats.map(chat => renderChatItem(chat))
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Render Unassigned Chats / Search/Filter layouts */}
                  {((showArchived || searchQuery || modelFilter !== 'all') ? filteredChats : unassignedChats).length > 0 && (
                    <div className="folder-group" style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px' }}>
                      {(!showArchived && !searchQuery && modelFilter === 'all' && folders.length > 0) && (
                        <div
                          className="folder-header-row"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '6px 8px',
                            borderRadius: 'var(--border-radius-md)',
                            backgroundColor: 'rgba(255,255,255,0.01)',
                            userSelect: 'none'
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2.5" style={{ marginRight: '6px' }}>
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                          </svg>
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>Uncategorized</span>
                        </div>
                      )}
                      <div className="folder-contents" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        {((showArchived || searchQuery || modelFilter !== 'all') ? filteredChats : unassignedChats).map(chat => renderChatItem(chat))}
                      </div>
                    </div>
                  )}

                </div>
              );
            })()
          )}
        </div>
      </div>

      {/* Bottom Profile Area */}
      <div className="sidebar-footer">
        {user ? (
          <>
            <div className="user-profile" onClick={() => setProfileOpen(true)} style={{ cursor: 'pointer' }} title="Profile Settings">
              <img src={avatarUrl} alt="Avatar" className="user-avatar" />
              <div className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-email">{user.email}</span>
              </div>
              <button className="logout-btn" onClick={(e) => { e.stopPropagation(); logout(); }} title="Sign Out">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
            <ProfileModal isOpen={isProfileOpen} onClose={() => setProfileOpen(false)} />
          </>
        ) : (
          <div className="auth-buttons-stack">
            <button className="login-google-btn glow-effect" onClick={loginWithGoogle}>
              <svg width="18" height="18" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="google-icon">
                <path d="M44.5 20H24v8.5h11.8C34.7 33.9 30.1 37 24 37c-7.2 0-13-5.8-13-13s5.8-13 13-13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 11.8 2 2 11.8 2 24s9.8 22 22 22c11 0 21-8 21-22 0-1.3-.2-2.7-.5-4z" fill="#FFC107"/>
                <path d="M6.3 14.7l7 5.1C15.2 16.2 19.3 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.6 4.1 29.6 2 24 2 16.3 2 9.6 7.4 6.3 14.7z" fill="#FF3D00"/>
                <path d="M24 46c5.5 0 10.5-1.9 14.3-5.1l-6.6-5.6C29.8 36.9 27 38 24 38c-6 0-10.7-3-11.8-8.4l-7 5.4C8.1 41.3 15.5 46 24 46z" fill="#4CAF50"/>
                <path d="M44.5 20H24v8.5h11.8c-.8 2.4-2.3 4.4-4.3 5.8l6.6 5.6C43 36 46 30.5 46 24c0-1.3-.2-2.7-.5-4z" fill="#1976D2"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <button className="login-email-btn" onClick={() => setAuthModalOpen(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>Sign in with Email</span>
            </button>
          </div>
        )}
      </div>

      {/* Usage Modal (accessible without login) */}
      <UsageModal isOpen={isUsageOpen} onClose={() => setUsageOpen(false)} />
    </aside>
  );
};
