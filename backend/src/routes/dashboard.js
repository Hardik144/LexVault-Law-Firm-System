const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/dashboard/summary
router.get('/summary', async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'ADMIN';
    const baseWhere = isAdmin ? {} : {
      OR: [
        { creatorId: req.user.id },
        { judgeId: req.user.id },
        { assignments: { some: { userId: req.user.id } } },
        { isRestricted: false },
      ],
    };

    const [
      totalCases,
      activeCases,
      pendingCases,
      closedCases,
      totalDocuments,
      totalUsers,
      recentCases,
      recentLogs,
    ] = await Promise.all([
      prisma.case.count({ where: baseWhere }),
      prisma.case.count({ where: { ...baseWhere, status: 'ACTIVE' } }),
      prisma.case.count({ where: { ...baseWhere, status: 'PENDING' } }),
      prisma.case.count({ where: { ...baseWhere, status: 'CLOSED' } }),
      prisma.document.count(),
      isAdmin ? prisma.user.count() : null,
      prisma.case.findMany({
        where: baseWhere,
        take: 5,
        orderBy: { updatedAt: 'desc' },
        select: { id: true, caseNumber: true, title: true, status: true, updatedAt: true },
      }),
      isAdmin ? prisma.accessLog.findMany({
        take: 10,
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { name: true } },
          case: { select: { caseNumber: true } },
        },
      }) : [],
    ]);

    res.json({
      stats: { totalCases, activeCases, pendingCases, closedCases, totalDocuments, totalUsers },
      recentCases,
      recentLogs,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
