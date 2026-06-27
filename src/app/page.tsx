'use client';

import React from 'react';
import { Sidebar } from '../presentation/components/sidebar/Sidebar';
import { ChatArea } from '../presentation/components/chat-area/ChatArea';
import { AuthModal } from '../presentation/components/auth-modal/AuthModal';
import { AgentModal } from '../presentation/components/agent-modal/AgentModal';
import { useChat } from '../presentation/context/chat-context';

export default function Home() {
  const { isSidebarOpen, setSidebarOpen, isAgentModalOpen, setAgentModalOpen } = useChat();

  return (
    <div style={{ display: 'flex', width: '100vw', height: '100dvh', overflow: 'hidden', position: 'relative' }}>
      {/* Sidebar overlay backdrop for mobile view */}
      {isSidebarOpen && (
        <div 
          className="mobile-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <Sidebar />
      <ChatArea />
      <AuthModal />
      <AgentModal isOpen={isAgentModalOpen} onClose={() => setAgentModalOpen(false)} />
    </div>
  );
}
