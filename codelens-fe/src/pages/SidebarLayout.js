// pages/SidebarLayout.jsx
import React, { useState, useEffect } from "react";
import Sidebar from "../components/common/Sidebar";
import { Outlet } from "react-router-dom";
import { getChatById, updateChatMessages, getAllChats } from "../config/chatDB";

const SidebarLayout = () => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);

  const handleSelectChat = async (chat) => {
    setSelectedChat(chat);
    localStorage.setItem("last_chat_id", chat.id);
    const fullChat = await getChatById(chat.id);
    setMessages(fullChat?.messages || []);
  };

  useEffect(() => {
    if (selectedChat && messages.length >= 0) {
      updateChatMessages(selectedChat.id, messages);
    }
  }, [messages, selectedChat]);

  // On initial mount, restore last opened chat like ChatGPT
  useEffect(() => {
    const restoreLastChat = async () => {
      if (selectedChat) return;
      const lastId = localStorage.getItem("last_chat_id");
      if (lastId) {
        const chat = await getChatById(lastId);
        if (chat) {
          setSelectedChat(chat);
          setMessages(chat.messages || []);
          return;
        }
      }
      // Fallback to most recent chat if any
      const all = await getAllChats();
      if (all && all.length > 0) {
        setSelectedChat(all[0]);
        setMessages(all[0].messages || []);
      }
    };
    restoreLastChat();
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // React to global "open-chat" from ChatStart or elsewhere
  useEffect(() => {
    const onOpenChat = async (e) => {
      const chatId = e?.detail?.chatId;
      if (!chatId) return;
      const chat = await getChatById(chatId);
      if (chat) {
        localStorage.setItem("last_chat_id", chat.id);
        setSelectedChat(chat);
        setMessages(chat.messages || []);
      }
    };
    window.addEventListener("open-chat", onOpenChat);
    return () => window.removeEventListener("open-chat", onOpenChat);
  }, []);

  return (
    <div className="layout-container">
      <Sidebar selectedChatId={selectedChat?.id} onSelectChat={handleSelectChat} />
      <div className="main-content">
        <Outlet context={{ selectedChat, messages, setMessages, setSelectedChat, handleSelectChat }} />
      </div>
    </div>
  );
};

export default SidebarLayout;
