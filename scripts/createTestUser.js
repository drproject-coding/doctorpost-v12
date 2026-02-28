import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config({ path: './server/.env' }); // Load .env from the server directory

const prisma = new PrismaClient();
const BCRYPT_SALT_ROUNDS = 10;

async function createTestUser() {
  const email = 'toto@gmail.com';
  const password = 'toto123$';

  try {
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

    const user = await prisma.user.upsert({
      where: { email: email },
      update: {
        passwordHash: hashedPassword,
        name: 'Toto',
        firstName: 'Toto',
        lastName: 'User',
        companyName: 'Test Company',
        role: 'Tester',
        industry: 'Software',
        audience: ['Developers'],
        tones: ['Casual & Witty'],
        offers: ['Testing Services'],
        taboos: ['Spam'],
        styleGuideEmoji: true,
        styleGuideHashtags: 3,
        styleGuideLinks: "end",
        copyGuideline: "Direct and clear.",
        contentStrategy: "Test everything.",
        definition: "A test user for DoctorPost.",
        openAIKey: null,
      },
      create: {
        email: email,
        passwordHash: hashedPassword,
        name: 'Toto',
        firstName: 'Toto',
        lastName: 'User',
        companyName: 'Test Company',
        role: 'Tester',
        industry: 'Software',
        audience: ['Developers'],
        tones: ['Casual & Witty'],
        offers: ['Testing Services'],
        taboos: ['Spam'],
        styleGuideEmoji: true,
        styleGuideHashtags: 3,
        styleGuideLinks: "end",
        copyGuideline: "Direct and clear.",
        contentStrategy: "Test everything.",
        definition: "A test user for DoctorPost.",
        openAIKey: null,
      },
    });
    console.log(`User '${user.email}' created/updated successfully!`);
  } catch (error) {
    console.error('Error creating/updating test user:', error);
  } finally {
    await prisma.$disconnect();
  }
}

void createTestUser();