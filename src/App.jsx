import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import SettingsModal from './components/SettingsModal';
import { sendMessageToAI } from './services/ai';

function App() {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I am your AI assistant. Configure your API key in Settings to start chatting.' }
    ]);
    const [loading, setLoading] = useState(false);
    const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Mobile responsiveness state
    const [isMobile, setIsMobile] = useState(false);
    const [showSidebar, setShowSidebar] = useState(true);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
            if (window.innerWidth > 768) {
                setShowSidebar(true);
            }
        };

        // Initial check
        handleResize();

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSendMessage = async (text) => {
        if (!apiKey) {
            alert('Please set your API Key in Settings first.');
            setIsSettingsOpen(true);
            return;
        }

        const newMessages = [...messages, { role: 'user', content: text }];
        setMessages(newMessages);
        setLoading(true);

        try {
            // Prepare context (last 10 messages)
            const context = newMessages.slice(-10).map(m => ({ role: m.role, content: m.content }));

            const response = await sendMessageToAI(context, apiKey);

            setMessages(prev => [...prev, { role: 'assistant', content: response }]);
        } catch (error) {
            setMessages(prev => [...prev, { role: 'assistant', content: 'Error: Could not fetch response. Check your API Key.' }]);
        } finally {
            setLoading(false);
        }
    };

    const saveApiKey = (key) => {
        setApiKey(key);
        localStorage.setItem('openai_api_key', key);
    };

    const handleMobileChatSelect = () => {
        if (isMobile) {
            setShowSidebar(false);
        }
    };

    const handleMobileBack = () => {
        setShowSidebar(true);
    };

    return (
        <div className="app-container">
            <Sidebar
                onOpenSettings={() => setIsSettingsOpen(true)}
                isMobile={isMobile}
                hidden={!showSidebar}
                onSelectChat={handleMobileChatSelect}
            />

            {/* On mobile, only show ChatArea when sidebar is hidden */}
            {(!isMobile || !showSidebar) && (
                <ChatArea
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    loading={loading}
                    onBack={handleMobileBack}
                    isMobile={isMobile}
                />
            )}



            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                onSave={saveApiKey}
                currentApiKey={apiKey}
            />
        </div>
    );
}

export default App;
