// Unified minimal in-memory entities to let the UI run locally.

const _sessions = {};
const _messages = {};
const _users = {
  me: {
    id: 'local-user',
    email: 'local@local',
    full_name: 'Local User',
    total_messages: 0,
    created_date: new Date().toISOString(),
    updated_date: new Date().toISOString(),
  }
};

function generateId(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 9);
}

export const ChatSession = {
  async create(data = {}) {
    const id = generateId('s_');
    const session = {
      id,
      title: data.title || 'New Conversation',
      first_message_preview: data.first_message_preview || '',
      message_count: data.message_count || 0,
      last_activity: data.last_activity || new Date().toISOString(),
      created_date: new Date().toISOString(),
      created_by: data.created_by || _users.me?.email || 'local@local',
      ...data,
    };
    _sessions[id] = session;
    _messages[id] = [];
    return session;
  },
  async get(id) {
    return _sessions[id] || null;
  },
  async list(order = '-last_activity') {
    return Object.values(_sessions).sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
  },
  async update(id, patch) {
    if (!_sessions[id]) return null;
    _sessions[id] = { ..._sessions[id], ...patch };
    return _sessions[id];
  },
  async filter(query = {}) {
    const all = Object.values(_sessions);
    return all.filter(s => Object.keys(query).every(k => String(s[k]) === String(query[k])));
  }
};

export const Message = {
  async create(data = {}) {
    const id = generateId('m_');
    const msg = {
      id,
      session_id: data.session_id,
      content: data.content || '',
      sender_type: data.sender_type || 'bot',
      timestamp: data.timestamp || new Date().toISOString(),
      ...data,
    };
    if (!_messages[msg.session_id]) _messages[msg.session_id] = [];
    _messages[msg.session_id].push(msg);
    return msg;
  },
  async filter(query = {}) {
    if (query.session_id) {
      return (_messages[query.session_id] || []).slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }
    return Object.values(_messages).flat();
  }
};

export const User = {
  async me() {
    return _users.me;
  },
  async updateMyUserData(patch = {}) {
    const now = new Date().toISOString();
    _users.me = { ..._users.me, ...patch, updated_date: now };
    return _users.me;
  }
};

export default { ChatSession, Message, User };
