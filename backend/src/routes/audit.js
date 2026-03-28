const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN'));

// GET /api/audit/logs
router.get('/logs', async (req, res, next) => {
  try {
    const { userId, caseId, action, from, to, page = 1, limit = 50 } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (caseId) where.caseId = caseId;
    if (action) where.action = { contains: action, mode: 'insensitive' };
    if (from || to) {
      where.timestamp = {};
      if (from) where.timestamp.gte = new Date(from);
      if (to) where.timestamp.lte = new Date(to);
    }

    const [logs, total] = await Promise.all([
      prisma.accessLog.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, email: true, role: true } },
          case: { select: { id: true, caseNumber: true, title: true } },
          document: { select: { id: true, originalName: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.accessLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
