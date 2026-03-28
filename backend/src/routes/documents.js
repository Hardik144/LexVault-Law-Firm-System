const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const prisma = require('../prisma/client');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { logAction } = require('../middleware/auditLog');

router.use(authenticate);

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file provided.' });
    const { caseId, type } = req.body;
    if (!caseId) return res.status(400).json({ error: 'caseId is required.' });

    const caseData = await prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) return res.status(404).json({ error: 'Case not found.' });

    // Get next version number
    const versionCount = await prisma.document.count({
      where: { caseId, originalName: req.file.originalname },
    });

    const doc = await prisma.document.create({
      data: {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        type: type || 'OTHER',
        version: versionCount + 1,
        path: req.file.path,
        caseId,
        uploadedById: req.user.id,
      },
      include: { uploadedBy: { select: { id: true, name: true } } },
    });

    await logAction({ userId: req.user.id, caseId, documentId: doc.id, action: 'UPLOAD', req });

    res.status(201).json({ document: doc });
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/case/:caseId
router.get('/case/:caseId', async (req, res, next) => {
  try {
    const docs = await prisma.document.findMany({
      where: { caseId: req.params.caseId },
      include: { uploadedBy: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    await logAction({ userId: req.user.id, caseId: req.params.caseId, action: 'VIEW_DOCUMENTS', req });

    res.json({ documents: docs });
  } catch (err) {
    next(err);
  }
});

// GET /api/documents/download/:id
router.get('/download/:id', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    if (!fs.existsSync(doc.path)) {
      return res.status(404).json({ error: 'File not found on server.' });
    }

    await logAction({ userId: req.user.id, caseId: doc.caseId, documentId: doc.id, action: 'DOWNLOAD', req });

    res.download(doc.path, doc.originalName);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res, next) => {
  try {
    const doc = await prisma.document.findUnique({ where: { id: req.params.id } });
    if (!doc) return res.status(404).json({ error: 'Document not found.' });

    if (fs.existsSync(doc.path)) {
      fs.unlinkSync(doc.path);
    }

    await prisma.document.delete({ where: { id: req.params.id } });
    res.json({ message: 'Document deleted.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
