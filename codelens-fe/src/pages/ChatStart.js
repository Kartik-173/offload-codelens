import React from "react";
import ChatEmptyState from "../components/chat/ChatEmptyState";
import { createChat } from "../config/chatDB";
import { useNavigate } from "react-router-dom";

const ChatStart = () => {
  const navigate = useNavigate();

  const handleStart = async (mode) => {
    try {
      const newChat = await createChat();
      localStorage.setItem("last_chat_id", newChat.id);
      // Notify app to select and show this chat immediately
      window.dispatchEvent(new CustomEvent("open-chat", { detail: { chatId: newChat.id } }));
      window.dispatchEvent(new Event("chats-updated"));
      // Route to chat
      navigate("/chat", { replace: true });
      // persist preferred mode in session so ChatInputBar can default (optional)
      sessionStorage.setItem("preferred_chat_mode", mode);
    } catch (e) {
      console.error("Failed to start chat", e);
    }
  };

  return (
    <div className="chat-start-page">
      <ChatEmptyState
        onStartChat={() => handleStart("CHAT")}
        onStartTerraform={() => handleStart("TERRAFORM")}
      />
    </div>
  );
};

export default ChatStart;
