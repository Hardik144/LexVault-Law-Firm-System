const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

const canAccessCase = async (caseData, user) => {
  if (!caseData.isRestricted) return true;
  if (user.role === 'ADMIN') return true;
  if (caseData.creatorId === user.id) return true;
  if (caseData.judgeId === user.id) return true;
  const assignment = await prisma.caseAssignment.findFirst({
    where: { caseId: caseData.id, userId: user.id },
  });
  return !!assignment;
};

// GET /api/cases
router.get('/', async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20, judgeId } = req.query;
    const where = {};
    if (status) where.status = status;
    if (judgeId) where.judgeId = judgeId;
    if (search) where.OR = [
      { caseNumber: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
    ];

    // Non-admins only see their own cases
    if (req.user.role !== 'ADMIN') {
      where.OR = [
        ...(where.OR || []),
        { isRestricted: false },
        { creatorId: req.user.id },
        { judgeId: req.user.id },
        { assignments: { some: { userId: req.user.id } } },
      ];
    }

    const [cases, total] = await Promise.all([
      prisma.case.findMany({
        where,
        include: {
          creator: { select: { id: true, name: true, email: true } },
          judge: { select: { id: true, name: true, email: true } },
          _count: { select: { documents: true, tasks: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.case.count({ where }),
    ]);

    res.json({ cases, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// POST /api/cases
router.post('/', authorize('ADMIN', 'CLERK', 'JUDGE'), async (req, res, next) => {
  try {
    const { title, description, status, judgeId, isRestricted, lawyerIds } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required.' });

    const caseNumber = `CASE-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const newCase = await prisma.case.create({
      data: {
        caseNumber,
        title,
        description,
        status: status || 'DRAFT',
        isRestricted: isRestricted || false,
        creatorId: req.user.id,
        judgeId: judgeId || null,
        assignments: {
          create: (lawyerIds || []).map(uid => ({ userId: uid, role: 'LAWYER' })),
        },
      },
      include: {
        creator: { select: { id: true, name: true } },
        judge: { select: { id: true, name: true } },
        assignments: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    res.status(201).json({ case: newCase });
  } catch (err) {
    next(err);
  }
});

// GET /api/cases/:id
router.get('/:id', async (req, res, next) => {
  try {
    const caseData = await prisma.case.findUnique({
      where: { id: req.params.id },
      include: {
        creator: { select: { id: true, name: true, email: true } },
        judge: { select: { id: true, name: true, email: true } },
        assignments: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
        documents: {
          include: { uploadedBy: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        tasks: {
          include: { assignedTo: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        comments: {
          include: { author: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!caseData) return res.status(404).json({ error: 'Case not found.' });

    const access = await canAccessCase(caseData, req.user);
    if (!access) return res.status(403).json({ error: 'Access denied to this restricted case.' });

    res.json({ case: caseData });
  } catch (err) {
    next(err);
  }
});

// PUT /api/cases/:id
router.put('/:id', authorize('ADMIN', 'CLERK', 'JUDGE'), async (req, res, next) => {
  try {
    const { title, description, status, judgeId, isRestricted, lawyerIds } = req.body;
    const existing = await prisma.case.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: 'Case not found.' });

    const data = {};
    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (judgeId !== undefined) data.judgeId = judgeId;
    if (isRestricted !== undefined) data.isRestricted = isRestricted;

    const updated = await prisma.case.update({
      where: { id: req.params.id },
      data,
      include: {
        creator: { select: { id: true, name: true } },
        judge: { select: { id: true, name: true } },
        assignments: { include: { user: { select: { id: true, name: true } } } },
      },
    });

    if (lawyerIds !== undefined) {
      await prisma.caseAssignment.deleteMany({ where: { caseId: req.params.id, role: 'LAWYER' } });
      await prisma.caseAssignment.createMany({
        data: lawyerIds.map(uid => ({ caseId: req.params.id, userId: uid, role: 'LAWYER' })),
        skipDuplicates: true,
      });
    }

    res.json({ case: updated });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cases/:id
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    await prisma.case.delete({ where: { id: req.params.id } });
    res.json({ message: 'Case deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
