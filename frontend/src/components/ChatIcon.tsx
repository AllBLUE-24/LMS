"use client";
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';

const ChatIcon = () => {
    return (
        <Link href="/chat">
            <div className="fixed bottom-4 right-4 bg-blue-500 text-white p-4 rounded-full shadow-lg cursor-pointer">
                <MessageCircle size={24} />
            </div>
        </Link>
    );
};

export default ChatIcon;
