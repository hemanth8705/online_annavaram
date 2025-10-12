const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/', async (_req, res) => {
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  const dbStatus = statusMap[mongoose.connection.readyState] || 'unknown';

  res.json({
    message: 'Test endpoint is working',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
