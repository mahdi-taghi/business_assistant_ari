import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

/**
 * Extracts data from API response, throws error if unsuccessful
 * @param {Object} result - API response object
 * @returns {any} Extracted data
 * @throws {Error} If response is not ok
 */
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

/**
 * Ensures payload is an array, handles paginated responses
 * @param {any} payload - Response payload
 * @returns {Array} Array of items
 */
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

/**
 * Custom hook for chat API operations
 * @returns {Object} Chat API methods
 */
export function useChatApi() {
  const { authenticatedRequest } = useAuth();

  /**
   * Creates a new chat session
   * @returns {Promise<Object>} New chat session data
   */
  const createChat = useCallback(async () => {
    const result = await authenticatedRequest("/chat/create/", {
      method: "POST",
    });
    return extractData(result);
  }, [authenticatedRequest]);

  /**
   * Fetches messages for a specific chat
   * @param {string|number} chatId - Chat session ID
   * @returns {Promise<Array>} Array of messages
   */
  const fetchMessages = useCallback(async (chatId) => {
    if (!chatId) {
      return [];
    }
    const result = await authenticatedRequest(`/chat/${chatId}/messages/`, {
      method: "GET",
    });
    return ensureArray(extractData(result));
  }, [authenticatedRequest]);

  /**
   * Lists all active chat sessions
   * @returns {Promise<Array>} Array of active chats
   */
  const listActiveChats = useCallback(async () => {
    const result = await authenticatedRequest("/chat/active/", {
      method: "GET",
    });
    return ensureArray(extractData(result));
  }, [authenticatedRequest]);

  /**
   * Lists all archived chat sessions
   * @returns {Promise<Array>} Array of archived chats
   */
  const listArchivedChats = useCallback(async () => {
    const result = await authenticatedRequest("/chat/archived/", {
      method: "GET",
    });
    return ensureArray(extractData(result));
  }, [authenticatedRequest]);

  /**
   * Toggles archive status of a chat
   * @param {string|number} chatId - Chat session ID
   * @returns {Promise<Object>} Updated chat data
   */
  const toggleArchive = useCallback(async (chatId) => {
    const result = await authenticatedRequest(`/chat/${chatId}/toggle-archive/`, {
      method: "PATCH",
    });
    return extractData(result);
  }, [authenticatedRequest]);

  /**
   * Deletes a chat session
   * @param {string|number} chatId - Chat session ID
   * @returns {Promise<boolean>} True if successful
   */
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
