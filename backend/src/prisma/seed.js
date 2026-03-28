const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('Admin@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@lawfirm.com' },
    update: {},
    create: {
      name: 'System Admin',
      email: 'admin@lawfirm.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });

  const judge = await prisma.user.upsert({
    where: { email: 'judge@lawfirm.com' },
    update: {},
    create: {
      name: 'Hon. Justice Smith',
      email: 'judge@lawfirm.com',
      password: await bcrypt.hash('Judge@123', 12),
      role: 'JUDGE',
    },
  });

  const lawyer = await prisma.user.upsert({
    where: { email: 'lawyer@lawfirm.com' },
    update: {},
    create: {
      name: 'Atty. Jane Doe',
      email: 'lawyer@lawfirm.com',
      password: await bcrypt.hash('Lawyer@123', 12),
      role: 'LAWYER',
    },
  });

  const clerk = await prisma.user.upsert({
    where: { email: 'clerk@lawfirm.com' },
    update: {},
    create: {
      name: 'John Clerk',
      email: 'clerk@lawfirm.com',
      password: await bcrypt.hash('Clerk@123', 12),
      role: 'CLERK',
    },
  });

  // Sample cases
  const case1 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2024-001',
      title: 'Smith vs. Johnson Property Dispute',
      description: 'A civil dispute over property boundaries in the north district.',
      status: 'ACTIVE',
      isRestricted: false,
      creatorId: clerk.id,
      judgeId: judge.id,
    },
  });

  const case2 = await prisma.case.create({
    data: {
      caseNumber: 'CASE-2024-002',
      title: 'State vs. Miller Criminal Case',
      description: 'Criminal case involving alleged financial fraud.',
      status: 'PENDING',
      isRestricted: true,
      creatorId: admin.id,
      judgeId: judge.id,
    },
  });

  // Assignments
  await prisma.caseAssignment.createMany({
    data: [
      { caseId: case1.id, userId: lawyer.id, role: 'LAWYER' },
      { caseId: case2.id, userId: lawyer.id, role: 'LAWYER' },
    ],
    skipDuplicates: true,
  });

  // Tasks
  await prisma.caseTask.createMany({
    data: [
      { caseId: case1.id, title: 'File initial pleadings', status: 'DONE', assignedToId: lawyer.id },
      { caseId: case1.id, title: 'Collect witness statements', status: 'IN_PROGRESS', assignedToId: lawyer.id },
      { caseId: case1.id, title: 'Prepare closing arguments', status: 'TODO' },
      { caseId: case2.id, title: 'Review financial records', status: 'TODO', assignedToId: lawyer.id },
    ],
  });

  // Comments
  await prisma.caseComment.createMany({
    data: [
      { caseId: case1.id, authorId: judge.id, content: 'Next hearing scheduled for January 15, 2025.' },
      { caseId: case1.id, authorId: lawyer.id, content: 'All documents submitted. Awaiting review.' },
    ],
  });

  console.log('Seed complete!');
  console.log('\nDemo credentials:');
  console.log('Admin:  admin@lawfirm.com  / Admin@123');
  console.log('Judge:  judge@lawfirm.com  / Judge@123');
  console.log('Lawyer: lawyer@lawfirm.com / Lawyer@123');
  console.log('Clerk:  clerk@lawfirm.com  / Clerk@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
