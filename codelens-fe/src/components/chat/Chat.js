import React, { useState, useRef, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { renameChat } from "../../config/chatDB.js";
import { ChatApiService } from "../../services";
import EditorModal from "./EditorModal.js";
import TerraformFilePreviewCard from "./TerraformFilePreviewCard.js";
import ChatInputBar from "./ChatInputBar.js";
import SnackbarNotification, { SNACKBAR_THEME } from "../common/SnackbarNotification.js";
import { createChat, getAllChats } from "../../config/chatDB.js";
import ChatEmptyState from "./ChatEmptyState";

const Chat = () => {
  // Get shared state and handlers from Outlet context (passed by SidebarLayout)
  const {
    selectedChat,
    messages,
    setMessages,
    setSelectedChat,
    handleSelectChat,
  } = useOutletContext();
  

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("CHAT");
  const [editableFiles, setEditableFiles] = useState(null);
  const messagesEndRef = useRef(null);

  // Snackbar state
  const [snackbarStatus, setSnackbarStatus] = useState(null);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Initialize mode from session (set by ChatStart) on first mount
  useEffect(() => {
    const pref = sessionStorage.getItem("preferred_chat_mode");
    if (pref === "CHAT" || pref === "TERRAFORM") {
      setMode(pref);
      // don't clear here; allow the selectedChat effect to also see it if needed
    }
  }, []);

  // Apply preferred mode (set by ChatStart) when a chat gets selected
  useEffect(() => {
    if (!selectedChat) return;
    const pref = sessionStorage.getItem("preferred_chat_mode");
    if (pref === "CHAT" || pref === "TERRAFORM") {
      setMode(pref);
      sessionStorage.removeItem("preferred_chat_mode");
    }
  }, [selectedChat]);

  // Detect whether any chats exist to decide empty-state rendering
  const [hasChats, setHasChats] = useState(true);
  useEffect(() => {
    (async () => {
      const all = await getAllChats();
      setHasChats((all?.length || 0) > 0);
    })();
  }, [selectedChat]);

  const startNewChat = async () => {
    try {
      const newChat = await createChat();
      localStorage.setItem("last_chat_id", newChat.id);
      setMessages([]);
      setSelectedChat(newChat);
      setMode("CHAT");
      window.dispatchEvent(new Event("chats-updated"));
    } catch (e) {
      console.error("Failed to start new chat", e);
      setSnackbarStatus("error");
      setSnackbarMessage("Failed to start a new chat.");
    }
  };

  const startNewTerraform = async () => {
    try {
      const newChat = await createChat();
      localStorage.setItem("last_chat_id", newChat.id);
      setMessages([]);
      setSelectedChat(newChat);
      setMode("TERRAFORM");
      window.dispatchEvent(new Event("chats-updated"));
    } catch (e) {
      console.error("Failed to start terraform chat", e);
      setSnackbarStatus("error");
      setSnackbarMessage("Failed to start Terraform mode.");
    }
  };

  const sendPromptToChat = async (prompt) => {
    if (!prompt || loading || !selectedChat) return;

    setEditableFiles(null);

    const userMessage = { text: prompt, sender: "user" };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput("");
    setLoading(true);

    const message_history = updatedMessages.map(({ sender, text }) => ({
      role: sender,
      content: text,
    }));

    try {
      let newAssistantMessage = null;

      if (mode === "TERRAFORM") {
        const res = await ChatApiService.submitTerraformJob({
          message_history,
          username: "demo-user",
          cloud_provider: "aws",
          vcs_provider: "github",
          mode: messages.length === 0 ? "create" : "reply",
        });
        const resPayload = res?.n8n_response?.[0];
        if (resPayload?.status === "ask") {
          newAssistantMessage = resPayload.last_question;
          setMessages((prev) => [
            ...prev,
            { text: newAssistantMessage, sender: "assistant" },
          ]);
        } else if (resPayload?.files) {
          newAssistantMessage = "Here are your Terraform files";
          setMessages((prev) => [
            ...prev,
            {
              text: resPayload?.files,
              sender: "assistant",
              files: resPayload.files,
            },
          ]);
        } else {
          newAssistantMessage = "⚠️ Unexpected response.";
          setMessages((prev) => [
            ...prev,
            { text: newAssistantMessage, sender: "assistant" },
          ]);
        }
      }

      if (mode === "CHAT") {
        const res = await ChatApiService.sendChatMessage({
          prompt,
        });
        newAssistantMessage = res?.data || "🤖 No response";
        setMessages((prev) => [
          ...prev,
          { text: newAssistantMessage, sender: "assistant" },
        ]);
      }

      // Generate Chat Title
      if (newAssistantMessage && selectedChat.title === "New Chat") {
        const combinedMessage = `User: ${prompt}\nAI: ${newAssistantMessage}`;

        try {
          const titleRes = await ChatApiService.generateChatTitle({
            chatId: selectedChat.id,
            latestAssistantMessage: combinedMessage,
          });

          const generatedTitle = titleRes?.[0]?.title;
          if (generatedTitle) {
            await renameChat(selectedChat.id, generatedTitle);
            window.dispatchEvent(new Event("chat-title-updated"));
            setSelectedChat((prev) => ({
              ...prev,
              title: generatedTitle,
            }));
          }
        } catch (err) {
          console.warn("⚠️ Failed to generate title:", err);
        }
      }
    } catch (error) {
      console.error("❌ Error submitting prompt:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "❌ Failed to get response from server.",
          sender: "assistant",
        },
      ]);
      setSnackbarStatus("error");
      setSnackbarMessage("❌ Failed to get response from server.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = () => {
    sendPromptToChat(input.trim());
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSaveFiles = async (updatedFiles, gitDetails) => {
    const github_username = localStorage.getItem("github_username");

    try {
      const res = await ChatApiService.pushToGitHub({
        github_username,
        repo: gitDetails.repoName,
        description: gitDetails.description,
        branch: gitDetails.branch,
        visibility: gitDetails.visibility,
        edited_files: updatedFiles,
      });

      setEditableFiles(null);
      return res;
    } catch (err) {
      console.error("❌ Push failed", err);
      return [];
    }
  };

  return (
    <div className="flex h-screen">
      <div className="chat-container shadow-lg flex-1 flex flex-col h-full overflow-hidden">
        {!selectedChat ? (
          hasChats ? (
            <div />
          ) : (
            <ChatEmptyState onStartChat={startNewChat} onStartTerraform={startNewTerraform} />
          )
        ) : (
        <div className="chat-list flex-1 overflow-y-auto">
          {messages.map((msg, idx) => (
            <div key={idx} className="message-row-wrapper">
              {msg.text && !msg.files && (
                <div className={`message-row ${msg.sender}`}>
                  <div className={`message-bubble ${msg.sender}`}>
                    {msg.text.split("\n").map((line, idx) => (
                      <span key={idx}>
                        {line}
                        <br />
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {msg.files && (
                <div className="file-card-wrapper">
                  <TerraformFilePreviewCard
                    files={msg.files}
                    onOpenEditor={() => setEditableFiles(msg.files)}
                  />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
        )}

        <EditorModal
          open={!!editableFiles}
          files={editableFiles}
          onClose={() => setEditableFiles(null)}
          onSave={handleSaveFiles}
          messages={messages}
          setMessages={setMessages}
          onAskAI={sendPromptToChat}
        />

        {selectedChat && (
          <ChatInputBar
            input={input}
            setInput={setInput}
            handleSend={handleSend}
            handleKeyPress={handleKeyPress}
            loading={loading}
            disabled={!selectedChat}
            mode={mode}
            setMode={setMode}
          />
        )}

        {/* Snackbar */}
      {snackbarStatus && (
        <SnackbarNotification
          initialOpen={true}
          duration={5000}
          message={snackbarMessage}
          actionButtonName={"Ok"}
          theme={
            snackbarStatus === "success"
              ? SNACKBAR_THEME.GREEN
              : SNACKBAR_THEME.RED
          }
          yPosition={"top"}
          xPosition={"center"}
        />
      )}
      </div>
    </div>
  );
};

export default Chat;
