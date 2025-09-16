// sessionService.js

const sessions = {}; // In-memory session store

const SESSION_TIMEOUT = process.env.SESSION_TIMEOUT || 15; // Default 15 minutes

const getSession = (sessionId) => sessions[sessionId];

const createOrUpdateSession = (sessionId, data) => {
    sessions[sessionId] = { ...data, lastActivity: Date.now() };
};

const deleteSession = (sessionId) => {
    delete sessions[sessionId];
};

const isSessionExpired = (sessionId) => {
    const session = getSession(sessionId);
    if (!session) return true;

    const currentTime = Date.now();
    const timeDiff = (currentTime - session.lastActivity) / (1000 * 60); // in minutes
    return timeDiff > SESSION_TIMEOUT;
};

module.exports = {
    getSession,
    createOrUpdateSession,
    deleteSession,
    isSessionExpired,
};
