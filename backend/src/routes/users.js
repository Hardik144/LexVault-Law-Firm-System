const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../prisma/client');
const { authenticate, authorize } = require('../middleware/auth');

// All user routes require authentication
router.use(authenticate);

// GET /api/users — Admin only
router.get('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const where = {};
    if (role) where.role = role;
    if (search) where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: { id: true, name: true, email: true, role: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    next(err);
  }
});

// POST /api/users — Admin only
router.post('/', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password required.' });
    }

    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ error: 'Email already registered.' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: role || 'CLERK' },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });

    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/:id — Admin only
router.put('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    const { name, email, role, password } = req.body;
    const data = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (role) data.role = role;
    if (password) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: req.params.id },
      data,
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id — Admin only
router.delete('/:id', authorize('ADMIN'), async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account.' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/by-role/:role — for dropdowns
router.get('/by-role/:role', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: req.params.role.toUpperCase() },
      select: { id: true, name: true, email: true, role: true },
    });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
