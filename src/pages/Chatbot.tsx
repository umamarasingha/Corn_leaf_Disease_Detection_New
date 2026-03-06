import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import {
  Send,
  Bot,
  User,
  Lightbulb,
  Book,
  AlertTriangle,
  CheckCircle,
  Leaf
} from 'lucide-react';
import { ChatResponse } from '../types';

interface ChatMessage {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: string;
  suggestions?: string[];
}

const Chatbot: React.FC = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content: 'Hello! I\'m your AI agricultural assistant specialized in corn leaf diseases. I can help you identify diseases, recommend treatments, and suggest prevention strategies. How can I help you today?',
      timestamp: new Date().toISOString(),
      suggestions: [
        'How to identify Northern Leaf Blight?',
        'Best prevention methods for corn diseases',
        'Treatment options for Common Rust',
        'When should I apply fungicide?'
      ]
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const response = await apiService.sendChatMessage(text);

      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: response.message,
        timestamp: response.timestamp,
        suggestions: response.suggestions,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Failed to send message:', error);
      const fallbackMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: 'Sorry, I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, fallbackMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = () => sendMessage(inputMessage);

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleQuickAction = (action: string) => {
    const quickMessages: Record<string, string> = {
      tips: 'Give me quick tips for preventing corn leaf diseases',
      guide: 'Show me how to identify common corn leaf diseases',
      emergency: 'I have a severe disease outbreak in my corn field, what should I do?',
      prevention: 'What are the best prevention strategies for corn diseases?',
    };
    sendMessage(quickMessages[action] || '');
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessageContent = (content: string) => {
    // Simple markdown-like rendering for bot responses
    const lines = content.split('\n');
    return lines.map((line, i) => {
      // Bold text
      let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      // Bullet points
      if (processed.startsWith('- ') || processed.startsWith('* ')) {
        return <li key={i} className="ml-4 list-disc" dangerouslySetInnerHTML={{ __html: processed.slice(2) }} />;
      }
      // Numbered items
      const numberedMatch = processed.match(/^(\d+)\.\s(.*)$/);
      if (numberedMatch) {
        return <li key={i} className="ml-4 list-decimal" dangerouslySetInnerHTML={{ __html: numberedMatch[2] }} />;
      }
      // Empty lines as spacing
      if (!processed.trim()) return <br key={i} />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: processed }} />;
    });
  };

  const quickActions = [
    { icon: Lightbulb, label: 'Tips', action: 'tips', color: 'text-yellow-600' },
    { icon: Book, label: 'Guide', action: 'guide', color: 'text-blue-600' },
    { icon: AlertTriangle, label: 'Emergency', action: 'emergency', color: 'text-red-600' },
    { icon: CheckCircle, label: 'Prevention', action: 'prevention', color: 'text-green-600' },
  ];

  return (
    <div className="w-full h-[calc(100vh-10rem)] lg:h-[calc(100vh-6rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-3 px-1">
        <div className="h-10 w-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
          <Leaf className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-100">CornDoc AI</h1>
          <p className="text-xs text-green-600 dark:text-green-400 font-medium">Online - Ready to help</p>
        </div>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
        {/* Quick Actions */}
        <div className="flex space-x-2 p-3 border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.action}
                onClick={() => handleQuickAction(action.action)}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-full transition-colors whitespace-nowrap border border-gray-200 dark:border-gray-600"
              >
                <Icon className={`h-3.5 w-3.5 ${action.color}`} />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{action.label}</span>
              </button>
            );
          })}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-start space-x-2 max-w-[85%] sm:max-w-[75%] ${
                message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}>
                {/* Avatar */}
                <div className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  message.type === 'user'
                    ? 'bg-green-600'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600'
                }`}>
                  {message.type === 'user' ? (
                    <User className="h-3.5 w-3.5 text-white" />
                  ) : (
                    <Bot className="h-3.5 w-3.5 text-white" />
                  )}
                </div>

                {/* Message Bubble */}
                <div className={`rounded-2xl px-3.5 py-2.5 ${
                  message.type === 'user'
                    ? 'bg-green-600 text-white rounded-br-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
                }`}>
                  <div className="text-sm leading-relaxed space-y-1">
                    {message.type === 'bot' ? renderMessageContent(message.content) : message.content}
                  </div>
                  <span className={`text-[10px] mt-1.5 block ${
                    message.type === 'user' ? 'text-green-200' : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {formatTime(message.timestamp)}
                  </span>

                  {/* Suggestions */}
                  {message.suggestions && message.type === 'bot' && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {message.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="text-xs bg-white dark:bg-gray-600 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700 hover:bg-green-50 dark:hover:bg-gray-500 rounded-full px-3 py-1 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start">
              <div className="flex items-start space-x-2">
                <div className="h-7 w-7 rounded-full bg-gradient-to-r from-green-500 to-emerald-600 flex items-center justify-center">
                  <Bot className="h-3.5 w-3.5 text-white" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex space-x-1.5">
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                    <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3">
          <div className="flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about corn diseases..."
              className="flex-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 dark:text-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder-gray-400"
              disabled={isTyping}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isTyping}
              className="h-10 w-10 flex items-center justify-center bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;
