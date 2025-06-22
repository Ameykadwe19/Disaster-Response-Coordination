// middlewares/mockAuth.js

const mockUsers = {
  netrunnerX: { id: 'netrunnerX', role: 'contributor' },
  reliefAdmin: { id: 'reliefAdmin', role: 'admin' }
};

const mockAuth = (req, res, next) => {
  const userId = req.headers['x-user-id'];

  if (!userId || !mockUsers[userId]) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or missing mock user ID' });
  }

  req.user = mockUsers[userId];
  next();
};

module.exports = mockAuth;
