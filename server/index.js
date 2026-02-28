import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import Redis from 'ioredis';
import fetch from 'node-fetch';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt'; // Import bcrypt

import { searchSubtopicsWithPerplexity } from './utils/perplexityService.js';
import { getPostRecommendations } from './utils/recommendationEngine.js';
import { generateContentWithOpenAI, searchSubtopicsWithOpenAI } from './utils/openaiService.js'; // Import searchSubtopicsWithOpenAI
import { enhancedPostTypes, enhancedHookPatterns, enhancedContentPillars, enhancedToneOptions } from './utils/dropdownData.js'; // Import dropdown data
import aiRouter from './routes/ai.js'; // NEW: Import the new AI router

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const REDIS_CACHE_EXPIRATION_SECONDS = 3600; // 1 hour
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Fallback for dev, but should be in .env
const BCRYPT_SALT_ROUNDS = 10; // For password hashing

// Initialize Prisma Client
const prisma = new PrismaClient();

// Initialize Redis Client
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => console.log('Connected to Redis!'));
redis.on('error', (err) => console.error('Redis Client Error', err));

// Middleware
app.use(cors()); // Allow all CORS for development
app.use(express.json());

// --- JWT Authentication Middleware ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) {
    // If no token, check if it's a public route (e.g., login, register)
    if (req.path === '/api/auth/google' || req.path === '/api/auth/register' || req.path === '/api/auth/login') {
      return next();
    }
    console.log('Auth: No token provided, returning 401.');
    return res.status(401).json({ message: 'Unauthorized: No token provided.' }); // Send JSON error
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error("Auth: JWT verification failed:", err);
      return res.status(403).json({ message: 'Forbidden: Invalid token.' }); // Send JSON error
    }
    req.user = user; // Attach user payload to request
    next();
  });
};

// Apply authentication middleware to all routes except specific public ones
app.use('/api', authenticateToken);

// NEW: Mount the AI router
app.use('/api/ai', aiRouter);

// --- API Endpoints ---

// Google Authentication Endpoint
app.post('/api/auth/google', async (req, res) => {
  const { id_token } = req.body;
  console.log('Google Auth: Received request.');

  if (!id_token) {
    console.log('Google Auth: ID token missing.');
    return res.status(400).json({ message: 'Google ID token is required.' });
  }

  try {
    console.log('Google Auth: Verifying ID token with Google.');
    const googleVerifyResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${id_token}`);
    const googleProfile = await googleVerifyResponse.json();

    if (googleProfile.error) {
      console.error("Google Auth: Google token verification error:", googleProfile.error_description);
      return res.status(401).json({ message: 'Invalid Google ID token.' });
    }
    console.log('Google Auth: Google token verified. Profile:', googleProfile.email);

    // Check if user exists in your DB
    let user = await prisma.user.findUnique({
      where: { googleId: googleProfile.sub },
    });
    console.log('Google Auth: User lookup in DB complete.');

    if (!user) {
      console.log('Google Auth: User not found, creating new user.');
      // If user doesn't exist, create a new one
      user = await prisma.user.create({
        data: {
          googleId: googleProfile.sub,
          email: googleProfile.email,
          name: googleProfile.name,
          picture: googleProfile.picture,
          firstName: googleProfile.given_name || '',
          lastName: googleProfile.family_name || '',
          companyName: '',
          role: '',
          industry: '',
          audience: [],
          tones: [],
          offers: [],
          taboos: [],
          styleGuideEmoji: true,
          styleGuideHashtags: 3,
          styleGuideLinks: "end",
          copyGuideline: "",
          contentStrategy: "",
          definition: "",
          openAIKey: null,
        },
      });
      console.log('Google Auth: New user created:', user.id);
    } else {
      console.log('Google Auth: Existing user found, updating profile.');
      // Update user's name/picture/email if they changed in Google
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          email: googleProfile.email,
          name: googleProfile.name,
          picture: googleProfile.picture,
        },
      });
      console.log('Google Auth: User profile updated:', user.id);
    }

    // Generate your application's JWT
    const appToken = jwt.sign(
      { id: user.id, googleId: user.googleId, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Google Auth: JWT generated.');

    // Invalidate relevant caches for this user
    await redis.del(`user:${user.id}:posts`);
    await redis.del(`user:${user.id}:profile`);
    await redis.del(`user:${user.id}:analytics`);
    console.log('Google Auth: Redis caches invalidated.');

    res.json({ token: appToken, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
    console.log('Google Auth: Response sent.');

  } catch (error) {
    console.error('Google Auth: Error during Google authentication:', error);
    res.status(500).json({ message: 'Internal server error during authentication.', error: error.message });
  }
});

// Email Registration Endpoint
app.post('/api/auth/register', async (req, res) => {
  const { email, password } = req.body;
  console.log('Register: Received request for email:', email);

  if (!email || !password) {
    console.log('Register: Email or password missing.');
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    console.log('Register: Checking if user exists.');
    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Register: User with this email already exists.');
      return res.status(409).json({ message: 'User with this email already exists.' });
    }
    console.log('Register: User does not exist, proceeding to hash password.');

    // Hash password
    const hashedPassword = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
    console.log('Register: Password hashed.');

    // Create new user
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword, // Store hashed password
        name: email.split('@')[0], // Default name from email
        firstName: email.split('@')[0],
        lastName: '',
        companyName: '',
        role: '',
        industry: '',
        audience: [],
        tones: [],
        offers: [],
        taboos: [],
        styleGuideEmoji: true,
        styleGuideHashtags: 3,
        styleGuideLinks: "end",
        copyGuideline: "",
        contentStrategy: "",
        definition: "",
        openAIKey: null,
      },
    });
    console.log('Register: New user created:', newUser.id);

    // Generate JWT for the new user
    const appToken = jwt.sign(
      { id: newUser.id, email: newUser.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Register: JWT generated.');

    res.status(201).json({ token: appToken, user: { id: newUser.id, name: newUser.name, email: newUser.email } });
    console.log('Register: Response sent.');

  } catch (error) {
    console.error('Register: Error during email registration:', error);
    // Ensure a JSON response is always sent
    res.status(500).json({ message: 'Internal server error during registration.', error: error.message });
  }
});

// Email Login Endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Login: Received request for email:', email);

  if (!email || !password) {
    console.log('Login: Email or password missing.');
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    console.log('Login: Looking up user by email.');
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      console.log('Login: User not found or no password hash.');
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    console.log('Login: User found, comparing passwords.');

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatch) {
      console.log('Login: Password mismatch.');
      return res.status(401).json({ message: 'Invalid credentials.' });
    }
    console.log('Login: Password matched.');

    // Generate JWT
    const appToken = jwt.sign(
      { id: user.id, email: user.email },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    console.log('Login: JWT generated.');

    // Invalidate relevant caches for this user
    await redis.del(`user:${user.id}:posts`);
    await redis.del(`user:${user.id}:profile`);
    await redis.del(`user:${user.id}:analytics`);
    console.log('Login: Redis caches invalidated.');

    res.json({ token: appToken, user: { id: user.id, name: user.name, email: user.email, picture: user.picture } });
    console.log('Login: Response sent.');

  } catch (error) {
    console.error('Login: Error during email login:', error);
    // Ensure a JSON response is always sent
    res.status(500).json({ message: 'Internal server error during login.', error: error.message });
  }
});


// Get current authenticated user's profile
app.get('/api/user/me', async (req, res) => {
  const userId = req.user.id; // User ID from JWT payload
  console.log('User Me: Received request for user ID:', userId);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        googleId: true,
        email: true,
        name: true,
        picture: true,
        firstName: true,
        lastName: true,
        companyName: true,
        role: true,
        openAIKey: true,
        industry: true,
        audience: true,
        tones: true,
        offers: true,
        taboos: true,
        styleGuideEmoji: true,
        styleGuideHashtags: true,
        styleGuideLinks: true,
        copyGuideline: true,
        contentStrategy: true,
        definition: true,
      },
    });

    if (!user) {
      console.log('User Me: User not found for ID:', userId);
      return res.status(404).json({ message: 'User not found.' });
    }
    res.json(user);
    console.log('User Me: Profile sent for ID:', userId);
  } catch (error) {
    console.error('User Me: Error fetching current user profile:', error);
    res.status(500).json({ message: 'Failed to fetch user profile.', error: error.message });
  }
});


// Get all posts for a user (with caching)
app.get('/api/posts', async (req, res) => {
  const userId = req.user.id; // User ID from JWT payload
  const cacheKey = `user:${userId}:posts`;
  console.log('Posts: Received request for user ID:', userId);

  try {
    const cachedPosts = await redis.get(cacheKey);
    if (cachedPosts) {
      console.log('Posts: Serving posts from cache for user ID:', userId);
      return res.json(JSON.parse(cachedPosts));
    }
    console.log('Posts: Fetching posts from DB for user ID:', userId);

    const posts = await prisma.post.findMany({
      where: { userId },
      orderBy: { scheduledAt: 'asc' },
    });
    await redis.set(cacheKey, JSON.stringify(posts), 'EX', REDIS_CACHE_EXPIRATION_SECONDS);
    console.log('Posts: Posts fetched from DB and cached for user ID:', userId);
    res.json(posts);
  } catch (error) {
    console.error('Posts: Error fetching posts:', error);
    res.status(500).json({ message: 'Failed to fetch posts', error: error.message });
  }
});

// Get a single post by ID
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // User ID from JWT payload
  console.log('Single Post: Received request for post ID:', id, 'by user ID:', userId);

  try {
    const post = await prisma.post.findUnique({
      where: { id, userId },
    });
    if (post) {
      res.json(post);
      console.log('Single Post: Post found and sent for ID:', id);
    } else {
      console.log('Single Post: Post not found for ID:', id);
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    console.error('Single Post: Error fetching post:', error);
    res.status(500).json({ message: 'Failed to fetch post', error: error.message });
  }
});

// Create a new post
app.post('/api/posts', async (req, res) => {
  const userId = req.user.id; // User ID from JWT payload
  const { title, content, scheduledAt, pillar, status } = req.body;
  console.log('Create Post: Received request by user ID:', userId, 'Title:', title);

  try {
    const newPost = await prisma.post.create({
      data: {
        title,
        content,
        scheduledAt: new Date(scheduledAt),
        pillar,
        status,
        userId,
      },
    });
    await redis.del(`user:${userId}:posts`); // Invalidate cache
    console.log('Create Post: New post created and cache invalidated for user ID:', userId);
    res.status(201).json(newPost);
  } catch (error) {
    console.error('Create Post: Error creating post:', error);
    res.status(500).json({ message: 'Failed to create post', error: error.message });
  }
});

// Update an existing post
app.put('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // User ID from JWT payload
  const { title, content, scheduledAt, pillar, status } = req.body;
  console.log('Update Post: Received request for post ID:', id, 'by user ID:', userId);

  try {
    const updatedPost = await prisma.post.update({
      where: { id, userId },
      data: {
        title,
        content,
        scheduledAt: new Date(scheduledAt),
        pillar,
        status,
      },
    });
    await redis.del(`user:${userId}:posts`); // Invalidate cache
    console.log('Update Post: Post updated and cache invalidated for user ID:', userId);
    res.json(updatedPost);
  } catch (error) {
    console.error('Update Post: Error updating post:', error);
    res.status(500).json({ message: 'Failed to update post', error: error.message });
  }
});

// Delete a post
app.delete('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // User ID from JWT payload
  console.log('Delete Post: Received request for post ID:', id, 'by user ID:', userId);

  try {
    await prisma.post.delete({
      where: { id, userId },
    });
    await redis.del(`user:${userId}:posts`); // Invalidate cache
    console.log('Delete Post: Post deleted and cache invalidated for user ID:', userId);
    res.status(204).send(); // 204 No Content for successful deletion
  } catch (error) {
    console.error('Delete Post: Error deleting post:', error);
    res.status(500).json({ message: 'Failed to delete post', error: error.message });
  }
});

// Get brand profile for a user (with caching)
app.get('/api/profile/:id', async (req, res) => {
  const userId = req.user.id; // Use ID from JWT payload
  const cacheKey = `user:${userId}:profile`;
  console.log('Profile: Received request for user ID:', userId);

  try {
    const cachedProfile = await redis.get(cacheKey);
    if (cachedProfile) {
      console.log('Profile: Serving profile from cache for user ID:', userId);
      return res.json(JSON.parse(cachedProfile));
    }
    console.log('Profile: Fetching profile from DB for user ID:', userId);

    let profile = await prisma.user.findUnique({ where: { id: userId } });

    // If no profile exists, create a default one (should ideally be handled during Google auth)
    if (!profile) {
      console.warn("Profile: Profile not found for authenticated user, creating default. This indicates an issue in auth flow.");
      profile = await prisma.user.create({
        data: {
          id: userId, // Use the authenticated user's ID
          firstName: "Jane",
          lastName: "Doe",
          companyName: "Future Tech Solutions",
          role: "Marketing Director",
          industry: "Technology Consulting",
          audience: ["CTOs", "IT Managers", "Startup Founders"],
          tones: ["Professional Authority", "Approachable Expert", "Educational Mentor"],
          offers: ["Digital Transformation Consulting", "IT Strategy", "Tech Implementation"],
          taboos: ["Politics", "Controversial topics", "Competitor criticism"],
          styleGuideEmoji: true,
          styleGuideHashtags: 3,
          styleGuideLinks: "end",
          copyGuideline: "",
          contentStrategy: "",
          definition: "",
          openAIKey: process.env.OPENAI_API_KEY || null,
        },
      });
      console.log('Profile: Default profile created for user ID:', userId);
    }
    await redis.set(cacheKey, JSON.stringify(profile), 'EX', REDIS_CACHE_EXPIRATION_SECONDS);
    console.log('Profile: Profile fetched from DB and cached for user ID:', userId);
    res.json(profile);
  } catch (error) {
    console.error('Profile: Error fetching/creating profile:', error);
    res.status(500).json({ message: 'Failed to fetch/create profile', error: error.message });
  }
});

// Update brand profile for a user
app.put('/api/profile/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // User ID from JWT payload
  console.log('Update Profile: Received request for profile ID:', id, 'by user ID:', userId);

  // Ensure the user can only update their own profile
  if (id !== userId) {
    console.log('Update Profile: Forbidden attempt to update another user\\'s profile.');
    return res.status(403).json({ message: 'Forbidden: You can only update your own profile.' });
  }

  const { openAIKey, ...data } = req.body;

  try {
    const updatedProfile = await prisma.user.update({
      where: { id: userId },
      data: {
        ...data,
        openAIKey: openAIKey || null,
      },
    });
    await redis.del(`user:${userId}:profile`); // Invalidate cache
    console.log('Update Profile: Profile updated and cache invalidated for user ID:', userId);
    res.json(updatedProfile);
  } catch (error) {
    console.error('Update Profile: Error updating profile:', error);
    res.status(500).json({ message: 'Failed to update profile', error: error.message });
  }
});

// Get analytics data for a user (with caching)
app.get('/api/analytics/:id', async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id; // User ID from JWT payload
  console.log('Analytics: Received request for user ID:', userId);

  // Ensure the user can only view their own analytics
  if (id !== userId) {
    console.log('Analytics: Forbidden attempt to view another user\\'s analytics.');
    return res.status(403).json({ message: 'Forbidden: You can only view your own analytics.' });
  }

  const cacheKey = `user:${userId}:analytics`;

  try {
    const cachedAnalytics = await redis.get(cacheKey);
    if (cachedAnalytics) {
      console.log('Analytics: Serving analytics from cache for user ID:', userId);
      return res.json(JSON.parse(cachedAnalytics));
    }
    console.log('Analytics: Generating mock analytics for user ID:', userId);

    const mockAnalytics = {
      totalImpressions: 58749,
      totalReactions: 2305,
      totalComments: 467,
      ctr: 3.8,
      topPerformingPillar: { name: "Technology", value: 23450 },
      topPerformingHook: { name: "Problem-Agitate-Solve", value: 986 },
      performanceByPillar: [
        { name: "Technology", impressions: 23450 },
        { name: "Industry Trends", impressions: 18240 },
        { name: "Case Studies", impressions: 12685 },
        { name: "Health Tips", impressions: 4374 }
      ],
      trendingTopics: ["AI Ethics", "Remote Collaboration Tools", "Cybersecurity", "Cloud Cost Optimization"],
      creatorEngagement: {
        averageCommentsPerPost: 15.6,
        averageReactionsPerPost: 76.8,
        followerGrowthRate: 2.4
      }
    };
    await redis.set(cacheKey, JSON.stringify(mockAnalytics), 'EX', REDIS_CACHE_EXPIRATION_SECONDS);
    console.log('Analytics: Mock analytics generated and cached for user ID:', userId);
    res.json(mockAnalytics);
  } catch (error) {
    console.error('Analytics: Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics', error: error.message });
  }
});

// OpenAI API Key Validation Endpoint (proxied)
app.post('/api/validate-openai-key', async (req, res) => {
  const { openAIKey } = req.body;
  console.log('OpenAI Validation: Received request.');

  if (!openAIKey) {
    console.log('OpenAI Validation: Key missing.');
    return res.status(400).json({ success: false, message: 'OpenAI key is required.' });
  }

  try {
    console.log('OpenAI Validation: Calling OpenAI API.');
    const openaiResponse = await fetch('https://api.openai.com/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${openAIKey}`,
        'Content-Type': 'application/json',
      },
    });

    const openaiData = await openaiResponse.json();
    console.log('OpenAI Validation: OpenAI API response status:', openaiResponse.status);

    if (openaiResponse.ok) {
      res.status(200).json({ success: true, message: 'API key validated successfully.', timestamp: new Date().toISOString() });
      console.log('OpenAI Validation: Key validated successfully.');
    } else {
      const errorMessage = openaiData.error?.message || 'Invalid API key or OpenAI service error.';
      res.status(openaiResponse.status).json({ success: false, message: errorMessage });
      console.log('OpenAI Validation: Key validation failed:', errorMessage);
    }
  } catch (error) {
    console.error('OpenAI Validation: Proxy error during OpenAI validation:', error);
    res.status(500).json({ success: false, message: 'Internal server error during validation.', error: error.message });
  }
});

// Subtopic Search Endpoint
app.get('/api/subtopics/search', async (req, res) => {
  const { topic, count, service } = req.query; // Get service parameter
  if (!topic) {
    return res.status(400).json({ message: 'Topic query parameter is required.' });
  }
  const subtopicCount = parseInt(count) || 5; // Default to 5 if not provided or invalid

  try {
    let subtopics;
    if (service === 'openai') {
      subtopics = await searchSubtopicsWithOpenAI(topic, subtopicCount);
    } else { // Default to perplexity
      subtopics = await searchSubtopicsWithPerplexity(topic, subtopicCount);
    }
    res.json(subtopics);
  } catch (error) {
    console.error('Error fetching subtopics:', error);
    res.status(500).json({ message: 'Failed to fetch subtopics.', error: error.message });
  }
});

// Post Attribute Recommendation Endpoint
app.post('/api/recommendations/attributes', async (req, res) => {
  const { topic, subtopic } = req.body;
  if (!topic || !subtopic) {
    return res.status(400).json({ message: 'Topic and subtopic are required for recommendations.' });
  }

  try {
    // Pass the full dropdown options to the recommendation engine
    const recommendations = await getPostRecommendations(
      topic,
      subtopic,
      enhancedPostTypes,
      enhancedHookPatterns,
      enhancedContentPillars,
      enhancedToneOptions
    );
    res.json(recommendations);
  } catch (error) {
    console.error('Error getting post recommendations:', error);
    res.status(500).json({ message: 'Failed to get post recommendations.', error: error.message });
  }
});

// AI Content Generation Endpoint
app.post('/api/generate/post', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ message: 'Prompt is required for content generation.' });
  }

  try {
    const generatedContent = await generateContentWithOpenAI(prompt);
    res.json({ content: generatedContent });
  } catch (error) {
    console.error('Error generating content:', error);
    res.status(500).json({ message: 'Failed to generate content.', error: error.message });
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

// Generic error handler to catch any unhandled exceptions
app.use((err, req, res, next) => {
  console.error('Global Error Handler: Something broke on the server!', err.stack); // Log the error stack for debugging
  res.status(500).json({ message: 'Something broke on the server!', error: err.message });
});