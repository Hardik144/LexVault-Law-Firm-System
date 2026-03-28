const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/comments/case/:caseId
router.get('/case/:caseId', async (req, res, next) => {
  try {
    const comments = await prisma.caseComment.findMany({
      where: { caseId: req.params.caseId },
      include: { author: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ comments });
  } catch (err) {
    next(err);
  }
});

// POST /api/comments
router.post('/', async (req, res, next) => {
  try {
    const { caseId, content } = req.body;
    if (!caseId || !content) return res.status(400).json({ error: 'caseId and content required.' });

    const comment = await prisma.caseComment.create({
      data: { caseId, content, authorId: req.user.id },
      include: { author: { select: { id: true, name: true, role: true } } },
    });
    res.status(201).json({ comment });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/comments/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const comment = await prisma.caseComment.findUnique({ where: { id: req.params.id } });
    if (!comment) return res.status(404).json({ error: 'Comment not found.' });
    if (comment.authorId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Cannot delete this comment.' });
    }
    await prisma.caseComment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Comment deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
