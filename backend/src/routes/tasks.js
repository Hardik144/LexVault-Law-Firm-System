const express = require('express');
const router = express.Router();
const prisma = require('../prisma/client');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/tasks/case/:caseId
router.get('/case/:caseId', async (req, res, next) => {
  try {
    const tasks = await prisma.caseTask.findMany({
      where: { caseId: req.params.caseId },
      include: { assignedTo: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ tasks });
  } catch (err) {
    next(err);
  }
});

// POST /api/tasks
router.post('/', async (req, res, next) => {
  try {
    const { caseId, title, description, status, assignedToId, dueDate } = req.body;
    if (!caseId || !title) return res.status(400).json({ error: 'caseId and title required.' });

    const task = await prisma.caseTask.create({
      data: { caseId, title, description, status: status || 'TODO', assignedToId, dueDate },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
    res.status(201).json({ task });
  } catch (err) {
    next(err);
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res, next) => {
  try {
    const { title, description, status, assignedToId, dueDate } = req.body;
    const task = await prisma.caseTask.update({
      where: { id: req.params.id },
      data: { title, description, status, assignedToId, dueDate },
      include: { assignedTo: { select: { id: true, name: true } } },
    });
    res.json({ task });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await prisma.caseTask.delete({ where: { id: req.params.id } });
    res.json({ message: 'Task deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
