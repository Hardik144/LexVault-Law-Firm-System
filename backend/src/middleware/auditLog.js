const prisma = require('../prisma/client');
const logger = require('../utils/logger');

const logAction = async ({ userId, caseId, documentId, action, req }) => {
  try {
    await prisma.accessLog.create({
      data: {
        userId,
        caseId: caseId || null,
        documentId: documentId || null,
        action,
        ip: req?.ip,
        userAgent: req?.headers?.['user-agent'],
      },
    });
  } catch (err) {
    logger.error('Failed to write audit log', { err: err.message });
  }
};

module.exports = { logAction };
