const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('ADMIN', 'JUDGE'));

// GET /api/reports/cases-by-status
router.get('/cases-by-status', async (req, res, next) => {
  try {
    const statuses = ['DRAFT', 'PENDING', 'ACTIVE', 'ON_HOLD', 'CLOSED'];
    const counts = await Promise.all(
      statuses.map(s => prisma.case.count({ where: { status: s } }))
    );
    const result = statuses.map((s, i) => ({ status: s, count: counts[i] }));
    res.json({ report: result });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/cases-by-judge
router.get('/cases-by-judge', async (req, res, next) => {
  try {
    const judges = await prisma.user.findMany({
      where: { role: 'JUDGE' },
      select: {
        id: true, name: true,
        judgedCases: { select: { id: true, status: true } },
      },
    });
    const report = judges.map(j => ({
      judge: j.name,
      judgeId: j.id,
      total: j.judgedCases.length,
      active: j.judgedCases.filter(c => c.status === 'ACTIVE').length,
      closed: j.judgedCases.filter(c => c.status === 'CLOSED').length,
    }));
    res.json({ report });
  } catch (err) {
    next(err);
  }
});

// GET /api/reports/document-activity
router.get('/document-activity', async (req, res, next) => {
  try {
    const logs = await prisma.accessLog.groupBy({
      by: ['action'],
      _count: { action: true },
    });
    res.json({ report: logs });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
