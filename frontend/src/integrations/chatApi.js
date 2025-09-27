import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

function extractData(result) {
  if (!result) {
    throw new Error("No response received from server");
  }
  if (!result.ok) {
    const detail = typeof result.data === "string" ? result.data : result.data?.error;
    throw new Error(detail || "درخواست ناموفق بود");
  }
  return result.data;
}

function ensureArray(payload) {
  if (!payload) {
    return [];
  }
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload.results)) {
    return payload.results;
  }
  return [];
}

export function useChatApi() {
  const { authenticatedRequest } = useAuth();

  const createChat = useCallback(async () => {
    const result = await authenticatedRequest("/chat/create/", {
      method: "POST",
    });
    return extractData(result);
  }, [authenticatedRequest]);

  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) {
      return [];
    }
    const result = await authenticatedRequest(`/chat/${chatId}/messages/`, {
      method: "GET",
    });
    return ensureArray(extractData(result));
  }, [authenticatedRequest]);

  const listActiveChats = useCallback(async () => {
    const result = await authenticatedRequest("/chat/active/", {
      method: "GET",
    });
    return ensureArray(extractData(result));
  }, [authenticatedRequest]);

  const listArchivedChats = useCallback(async () => {
    const result = await authenticatedRequest("/chat/archived/", {
      method: "GET",
    });
    return ensureArray(extractData(result));
  }, [authenticatedRequest]);

  const toggleArchive = useCallback(async (chatId) => {
    const result = await authenticatedRequest(`/chat/${chatId}/toggle-archive/`, {
      method: "PATCH",
    });
    return extractData(result);
  }, [authenticatedRequest]);

  const deleteChat = useCallback(async (chatId) => {
    const result = await authenticatedRequest(`/chat/${chatId}/delete/`, {
      method: "DELETE",
    });
    if (!result.ok) {
      const detail = typeof result.data === "string" ? result.data : result.data?.error;
      throw new Error(detail || "حذف گفتگو ناموفق بود");
    }
    return true;
  }, [authenticatedRequest]);

  return {
    createChat,
    fetchMessages,
    listActiveChats,
    listArchivedChats,
    toggleArchive,
    deleteChat,
  };
}

export default useChatApi;
