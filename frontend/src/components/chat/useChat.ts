import { useState, useEffect, useRef } from 'react';
import { getChatHistory } from '@/lib/api';
import { useAuth } from '@/context/AuthContext'; // Import useAuth

interface ChatMessage {
    id: string;
    user_id: string;
    username: string;
    message: string;
    timestamp: string;
}

export const useChat = (channelId: string) => {
    const { idToken } = useAuth(); // Get the token from AuthContext
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const websocket = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!channelId || !idToken) return; // Don't connect without channel or token

        const fetchHistory = async () => {
            try {
                const history = await getChatHistory(channelId);
                setMessages(history.reverse());
            } catch (error) {
                console.error("Failed to fetch chat history:", error);
            }
        };

        fetchHistory();

        const wsUrl = `${process.env.NEXT_PUBLIC_WEBSOCKET_URL}/ws/chat/${channelId}?token=${idToken}`;
        websocket.current = new WebSocket(wsUrl);

        websocket.current.onopen = () => {
            console.log("WebSocket connected");
            setIsConnected(true);
        };

        websocket.current.onmessage = (event) => {
            const newMessage = JSON.parse(event.data);
            setMessages((prevMessages) => [...prevMessages, newMessage]);
        };

        websocket.current.onclose = () => {
            console.log("WebSocket disconnected");
            setIsConnected(false);
        };

        websocket.current.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        return () => {
            websocket.current?.close();
        };
    }, [channelId, idToken]);

    const sendMessage = (message: string) => {
        if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
            websocket.current.send(message);
        } else {
            console.error("WebSocket is not connected.");
        }
    };

    return { messages, sendMessage, isConnected };
};