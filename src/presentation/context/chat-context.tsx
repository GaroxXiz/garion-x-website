'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Chat } from '../../domain/entities/chat';
import { Message } from '../../domain/entities/message';
import { Personality } from '../../domain/entities/personality';
import { ChatRepositoryImpl } from '../../data/repositories/chat-repository-impl';
import { apiDataSource } from '../../data/datasources/chat-api-datasource';
import { GetChatsUseCase } from '../../domain/usecases/get-chats';
import { CreateChatUseCase } from '../../domain/usecases/create-chat';
import { GetMessagesUseCase } from '../../domain/usecases/get-messages';
import { SendMessageUseCase } from '../../domain/usecases/send-message';
import { DeleteChatUseCase } from '../../domain/usecases/delete-chat';

interface User {
  username: string;
  name: string;
  email: string;
  avatarUrl: string;
}

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  loading: boolean;
  personalities: Personality[];
  selectedPersonalityId: string;
  setSelectedPersonalityId: (id: string) => void;
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
  user: User | null;
  isSidebarOpen: boolean;
  setSidebarOpen: (isOpen: boolean) => void;
  isAuthModalOpen: boolean;
  setAuthModalOpen: (isOpen: boolean) => void;
  isAgentModalOpen: boolean;
  setAgentModalOpen: (isOpen: boolean) => void;
  startNewChat: () => void;
  selectChat: (chatId: string) => Promise<void>;
  deleteChat: (chatId: string) => Promise<void>;
  sendMessage: (content: string, attachmentUrl?: string, attachmentType?: string) => Promise<void>;
  uploadFile: (file: File) => Promise<{ url: string; type: string }>;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, password: string, email: string, name: string) => Promise<void>;
  sendOtp: (email: string) => Promise<any>;
  verifyOtp: (email: string, otp: string) => Promise<void>;
  loginWithGoogle: () => void; // Will trigger modal opening
  logout: () => void;
  getProfile: () => Promise<void>;
  updateProfile: (name: string, email: string) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  createPersonality: (name: string, description: string, systemPrompt: string) => Promise<Personality>;
  pinChat: (chatId: string) => Promise<void>;
  archiveChat: (chatId: string) => Promise<void>;
  shareChat: (chatId: string) => Promise<string>;
  regenerateLastResponse: () => Promise<void>;
  cancelStreaming: () => void;
  showArchived: boolean;
  setShowArchived: (show: boolean) => void;
  streamingMessageId: string | null;
  streamingText: string;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize Usecases using useMemo
  const usecases = useMemo(() => {
    const repo = new ChatRepositoryImpl();

    return {
      getChats: new GetChatsUseCase(repo),
      createChat: new CreateChatUseCase(repo),
      getMessages: new GetMessagesUseCase(repo),
      sendMessage: new SendMessageUseCase(repo),
      deleteChat: new DeleteChatUseCase(repo),
    };
  }, []);

  // 2. Component State
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [personalities, setPersonalities] = useState<Personality[]>([]);
  const [selectedPersonalityId, setSelectedPersonalityId] = useState<string>('garionx');
  const [selectedModelId, setSelectedModelId] = useState<string>('openai');
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [isAuthModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [isAgentModalOpen, setAgentModalOpen] = useState<boolean>(false);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  // Refs for aborting and clearing intervals
  const streamingIntervalRef = React.useRef<any>(null);
  const isAbortedRef = React.useRef<boolean>(false);

  // Streaming text simulation state
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [streamingText, setStreamingText] = useState<string>('');

  // Keep track of code we are currently exchanging to prevent Strict Mode double-fetch
  const exchangingCodeRef = React.useRef<string | null>(null);

  // 3. Load initial data on mount (client-side only)
  useEffect(() => {
    const initData = async () => {
      try {
        // Load personalities from API
        const modelList = await apiDataSource.getPersonalities();
        setPersonalities(modelList);

        // Check standard auth status
        const savedUser = localStorage.getItem('garionx_user');
        const token = localStorage.getItem('garionx_token');
        if (savedUser && token) {
          setUser(JSON.parse(savedUser));
          const chatList = await usecases.getChats.execute();
          setChats(chatList);
        }
      } catch (error) {
        console.error('Failed to initialize GarionX application:', error);
      }
    };
    initData();
  }, [usecases]);

  // 4. Operations
  const startNewChat = () => {
    setActiveChat(null);
    setMessages([]);
    setSelectedModelId('openai');
    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const selectChat = async (chatId: string) => {
    const selected = chats.find((c) => c.id === chatId);
    if (!selected) return;

    setActiveChat(selected);
    setSelectedPersonalityId(selected.personalityId);
    setSelectedModelId(selected.model || 'openai');
    
    // Clear typing animation states
    setStreamingMessageId(null);
    setStreamingText('');

    try {
      const chatMessages = await usecases.getMessages.execute(chatId);
      setMessages(chatMessages);
    } catch (e) {
      console.error('Failed to load messages:', e);
    }

    // Close sidebar on mobile
    if (window.innerWidth <= 768) {
      setSidebarOpen(false);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      await usecases.deleteChat.execute(chatId);
      const updatedChats = await usecases.getChats.execute();
      setChats(updatedChats);

      if (activeChat?.id === chatId) {
        startNewChat();
      }
    } catch (e) {
      console.error('Failed to delete chat:', e);
    }
  };

  // Simulated word-by-word streaming effect
  const simulateStreaming = (messageId: string, fullText: string, onDone: () => void) => {
    setStreamingMessageId(messageId);
    setStreamingText('');
    
    const words = fullText.split(' ');
    let currentWordIndex = 0;
    let currentText = '';

    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
    }

    streamingIntervalRef.current = setInterval(() => {
      if (isAbortedRef.current) {
        if (streamingIntervalRef.current) {
          clearInterval(streamingIntervalRef.current);
          streamingIntervalRef.current = null;
        }
        return;
      }

      if (currentWordIndex < words.length) {
        currentText += (currentWordIndex === 0 ? '' : ' ') + words[currentWordIndex];
        setStreamingText(currentText);
        currentWordIndex++;
      } else {
        clearInterval(streamingIntervalRef.current);
        streamingIntervalRef.current = null;
        setStreamingMessageId(null);
        setStreamingText('');
        onDone();
      }
    }, 45); // Speed of streaming
  };

  const sendMessage = async (content: string, attachmentUrl?: string, attachmentType?: string) => {
    if (!content.trim() && !attachmentUrl) return;

    // Force user to log in before chatting for proper security context
    if (!user) {
      setAuthModalOpen(true);
      return;
    }

    let currentChat = activeChat;
    isAbortedRef.current = false;
    
    // Create new chat session if none is active
    if (!currentChat) {
      try {
        currentChat = await usecases.createChat.execute(selectedPersonalityId, selectedModelId);
        if (isAbortedRef.current) return;
        setActiveChat(currentChat);
        const updatedChats = await usecases.getChats.execute();
        setChats(updatedChats);
      } catch (e) {
        console.error('Failed to create chat on message send:', e);
        return;
      }
    }

    // Set loading indicator
    setLoading(true);

    // Optimistically update user message in local state
    const placeholderUserMsg: Message = {
      id: 'placeholder-user-' + Date.now(),
      chatId: currentChat.id,
      sender: 'user',
      content,
      createdAt: new Date(),
      attachmentUrl,
      attachmentType
    };
    setMessages((prev) => [...prev, placeholderUserMsg]);

    try {
      const { userMessage, assistantMessage } = await usecases.sendMessage.execute(
        currentChat.id,
        content,
        currentChat.personalityId,
        selectedModelId,
        attachmentUrl,
        attachmentType
      );

      if (isAbortedRef.current) return;

      // Replace user placeholder with real message from DB
      setMessages((prev) => prev.map((m) => (m.id === placeholderUserMsg.id ? userMessage : m)));

      // Simulate streaming for bot response
      simulateStreaming(assistantMessage.id, assistantMessage.content, () => {
        if (isAbortedRef.current) return;
        setMessages((prev) => [...prev, assistantMessage]);
      });

      // Update chats list (e.g. in case title was updated)
      const updatedChats = await usecases.getChats.execute();
      setChats(updatedChats);

      // Sync active chat header title
      const refreshedActiveChat = updatedChats.find((c) => c.id === currentChat!.id);
      if (refreshedActiveChat && !isAbortedRef.current) {
        setActiveChat(refreshedActiveChat);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setLoading(false);
    }
  };

  // HTTP JWT Authenticators
  const login = async (email: string, password: string) => {
    try {
      const response = await apiDataSource.login(email, password);
      const { token, ...profile } = response;
      
      localStorage.setItem('garionx_token', token);
      localStorage.setItem('garionx_user', JSON.stringify(profile));
      
      setUser(profile);
      setAuthModalOpen(false);

      // Load user specific chats
      const chatList = await usecases.getChats.execute();
      setChats(chatList);
    } catch (e: any) {
      throw new Error(e.message || 'Login failed');
    }
  };

  const register = async (username: string, password: string, email: string, name: string) => {
    try {
      const response = await apiDataSource.register(username, password, email, name);
      const { token, ...profile } = response;

      localStorage.setItem('garionx_token', token);
      localStorage.setItem('garionx_user', JSON.stringify(profile));

      setUser(profile);
      setAuthModalOpen(false);

      // Initialize chats list
      const chatList = await usecases.getChats.execute();
      setChats(chatList);
    } catch (e: any) {
      throw new Error(e.message || 'Registration failed');
    }
  };

  const sendOtp = async (email: string) => {
    try {
      const response = await apiDataSource.sendOtp(email);
      return response;
    } catch (e: any) {
      throw new Error(e.message || 'Failed to send OTP code.');
    }
  };

  const verifyOtp = async (email: string, otp: string) => {
    try {
      const response = await apiDataSource.verifyOtp(email, otp);
      const { token, ...profile } = response;

      localStorage.setItem('garionx_token', token);
      localStorage.setItem('garionx_user', JSON.stringify(profile));

      setUser(profile);
      setAuthModalOpen(false);

      // Load user specific chats
      const chatList = await usecases.getChats.execute();
      setChats(chatList);
    } catch (e: any) {
      throw new Error(e.message || 'OTP verification failed.');
    }
  };

  const getProfile = async () => {
    try {
      const response = await apiDataSource.getProfile();
      const { token, ...profile } = response;
      localStorage.setItem('garionx_token', token);
      localStorage.setItem('garionx_user', JSON.stringify(profile));
      setUser(profile);
    } catch (e: any) {
      // If token is invalid/expired, log the user out silently
      console.warn('[GarionX] Failed to refresh profile:', e.message);
    }
  };

  const updateProfile = async (name: string, email: string) => {
    try {
      const response = await apiDataSource.updateProfile(name, email);
      const { token, ...profile } = response;

      localStorage.setItem('garionx_token', token);
      localStorage.setItem('garionx_user', JSON.stringify(profile));
      setUser(profile);
    } catch (e: any) {
      throw new Error(e.message || 'Failed to update profile');
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const response = await apiDataSource.uploadAvatar(file);
      const { token, ...profile } = response;

      localStorage.setItem('garionx_token', token);
      localStorage.setItem('garionx_user', JSON.stringify(profile));
      setUser(profile);
    } catch (e: any) {
      throw new Error(e.message || 'Failed to upload avatar');
    }
  };

  const loginWithGoogle = async () => {
    if (typeof window === 'undefined') return;
    
    // Dynamic imports for SSR safety
    const { signInWithPopup, GoogleAuthProvider } = await import('firebase/auth');
    const { auth } = await import('./firebase-config');

    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      const result = await signInWithPopup(auth, provider);
      const idToken = await result.user.getIdToken();
      
      const response = await apiDataSource.loginWithGoogle(
        idToken,
        result.user.displayName,
        result.user.photoURL
      );
      const { token, ...profile } = response;

      localStorage.setItem('garionx_token', token);
      localStorage.setItem('garionx_user', JSON.stringify(profile));
      setUser(profile);
      
      // Close modal on success if setter exists
      if (typeof setAuthModalOpen === 'function') {
        setAuthModalOpen(false);
      }

      const chatList = await usecases.getChats.execute();
      setChats(chatList);
    } catch (error: any) {
      console.error('Firebase Google login error:', error);
      if (error.code !== 'auth/popup-closed-by-user') {
        alert(`Google Sign-In failed: ${error.message || 'Verification failed.'}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setChats([]);
    setActiveChat(null);
    setMessages([]);
    localStorage.removeItem('garionx_token');
    localStorage.removeItem('garionx_user');
  };

  const createPersonality = async (name: string, description: string, systemPrompt: string) => {
    try {
      const newP = await apiDataSource.createPersonality(name, description, systemPrompt);
      setPersonalities((prev) => [...prev, newP]);
      setSelectedPersonalityId(newP.id);
      return newP;
    } catch (e: any) {
      throw new Error(e.message || 'Failed to create agent');
    }
  };

  const cancelStreaming = () => {
    isAbortedRef.current = true;
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
    setStreamingMessageId(null);
    setStreamingText('');
    setLoading(false);
  };

  const pinChat = async (chatId: string) => {
    try {
      await apiDataSource.pinChat(chatId);
      const updatedChats = await usecases.getChats.execute();
      setChats(updatedChats);
      
      if (activeChat?.id === chatId) {
        setActiveChat((prev) => prev ? { ...prev, isPinned: !prev.isPinned } : null);
      }
    } catch (e) {
      console.error('Failed to pin chat:', e);
    }
  };

  const archiveChat = async (chatId: string) => {
    try {
      await apiDataSource.archiveChat(chatId);
      const updatedChats = await usecases.getChats.execute();
      setChats(updatedChats);

      if (activeChat?.id === chatId) {
        startNewChat();
      }
    } catch (e) {
      console.error('Failed to archive chat:', e);
    }
  };

  const shareChat = async (chatId: string): Promise<string> => {
    try {
      const response = await apiDataSource.shareChat(chatId);
      const updatedChats = await usecases.getChats.execute();
      setChats(updatedChats);
      if (activeChat?.id === chatId) {
        setActiveChat((prev) => prev ? { ...prev, isShared: true, shareToken: response.shareToken } : null);
      }
      return response.shareToken;
    } catch (e) {
      console.error('Failed to share chat:', e);
      throw e;
    }
  };

  const regenerateLastResponse = async () => {
    if (messages.length === 0 || loading || !!streamingMessageId) return;

    const userMessages = messages.filter((m) => m.sender === 'user');
    if (userMessages.length === 0) return;

    const lastUserMessage = userMessages[userMessages.length - 1];

    setMessages((prev) => {
      const copy = [...prev];
      if (copy.length > 0 && copy[copy.length - 1].sender === 'assistant') {
        copy.pop();
      }
      return copy;
    });

    await sendMessage(lastUserMessage.content, lastUserMessage.attachmentUrl, lastUserMessage.attachmentType);
  };

  const uploadFile = async (file: File) => {
    return apiDataSource.uploadFile(file);
  };

  return (
    <ChatContext.Provider
      value={{
        chats,
        activeChat,
        messages,
        loading,
        personalities,
        selectedPersonalityId,
        setSelectedPersonalityId,
        selectedModelId,
        setSelectedModelId,
        user,
        isSidebarOpen,
        setSidebarOpen,
        isAuthModalOpen,
        setAuthModalOpen,
        isAgentModalOpen,
        setAgentModalOpen,
        startNewChat,
        selectChat,
        deleteChat,
        sendMessage,
        uploadFile,
        login,
        register,
        sendOtp,
        verifyOtp,
        loginWithGoogle,
        logout,
        getProfile,
        updateProfile,
        uploadAvatar,
        createPersonality,
        pinChat,
        archiveChat,
        shareChat,
        regenerateLastResponse,
        cancelStreaming,
        showArchived,
        setShowArchived,
        streamingMessageId,
        streamingText,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
