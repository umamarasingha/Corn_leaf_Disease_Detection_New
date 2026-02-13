const functions = require('firebase-functions');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'cornleaf-secret-key';

// Middleware
app.use(helmet());
app.use(cors({ origin: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Firebase Storage for file uploads
const { Storage } = require('@google-cloud/storage');
const storage = new Storage();
const bucketName = 'corn-leaf-disease-detector.appspot.com';
const bucket = storage.bucket(bucketName);

// Multer configuration for memory storage (uploads to Firebase Storage)
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Firestore database references
const db = admin.firestore();
const usersCollection = db.collection('users');
const detectionsCollection = db.collection('detections');
const postsCollection = db.collection('posts');
const newsCollection = db.collection('news');
const chatsCollection = db.collection('chats');

// Authentication middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
}

// Helper to find user by email
async function findUserByEmail(email) {
  const snapshot = await usersCollection.where('email', '==', email).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

// Helper to find user by ID
async function findUserById(id) {
  const doc = await usersCollection.doc(id).get();
  if (!doc.exists) return null;
  return { id: doc.id, ...doc.data() };
}

// Routes

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Update last login
    await usersCollection.doc(user.id).update({
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name required' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = {
      email,
      password: hashedPassword,
      name,
      role: 'USER',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await usersCollection.add(newUser);
    const userId = docRef.id;

    const token = jwt.sign(
      { id: userId, email: newUser.email, role: newUser.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      user: { id: userId, email: newUser.email, name: newUser.name, role: newUser.role },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/validate', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password required' });
    }

    const user = await findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await usersCollection.doc(user.id).update({ password: hashedPassword });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Upload image and detect disease
app.post('/api/detect', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    // Upload image to Firebase Storage
    const fileName = `detections/${uuidv4()}-${Date.now()}-${req.file.originalname}`;
    const file = bucket.file(fileName);

    await file.save(req.file.buffer, {
      metadata: {
        contentType: req.file.mimetype,
      },
    });

    // Make the file publicly accessible
    await file.makePublic();
    const imageUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    // Simulate disease detection (replace with actual ML model)
    const diseases = ['Northern Leaf Blight', 'Gray Leaf Spot', 'Common Rust', 'Healthy'];
    const detectedDisease = diseases[Math.floor(Math.random() * diseases.length)];
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-100% confidence

    // Save detection result to Firestore
    const detection = {
      userId: req.user.id,
      imageUrl,
      detectedDisease,
      confidence,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await detectionsCollection.add(detection);

    res.json({
      success: true,
      disease: detectedDisease,
      confidence,
      imageUrl,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Detection error:', error);
    res.status(500).json({ error: 'Detection failed' });
  }
});

// Get user detections
app.get('/api/detections', authenticateToken, async (req, res) => {
  try {
    const snapshot = await detectionsCollection
      .where('userId', '==', req.user.id)
      .orderBy('timestamp', 'desc')
      .get();

    const detections = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(detections);
  } catch (error) {
    console.error('Get detections error:', error);
    res.status(500).json({ error: 'Failed to get detections' });
  }
});

app.get('/api/detection/:detectionId', authenticateToken, async (req, res) => {
  try {
    const { detectionId } = req.params;
    const doc = await detectionsCollection.doc(detectionId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Detection not found' });
    }

    const detection = { id: doc.id, ...doc.data() };

    // Check access permissions
    if (detection.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(detection);
  } catch (error) {
    console.error('Get detection error:', error);
    res.status(500).json({ error: 'Failed to get detection' });
  }
});

app.delete('/api/detection/:detectionId', authenticateToken, async (req, res) => {
  try {
    const { detectionId } = req.params;
    const doc = await detectionsCollection.doc(detectionId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Detection not found' });
    }

    const detection = { id: doc.id, ...doc.data() };

    // Check access permissions
    if (detection.userId !== req.user.id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Access denied' });
    }

    await detectionsCollection.doc(detectionId).delete();

    res.json({ message: 'Detection deleted successfully' });
  } catch (error) {
    console.error('Delete detection error:', error);
    res.status(500).json({ error: 'Failed to delete detection' });
  }
});

// Get all users (admin only)
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const snapshot = await usersCollection.get();
    const users = snapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      name: doc.data().name,
      role: doc.data().role,
      createdAt: doc.data().createdAt
    }));

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

app.delete('/api/admin/users/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;

    // Prevent admin from deleting themselves
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await usersCollection.doc(userId).delete();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

app.delete('/api/admin/posts/:postId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { postId } = req.params;

    await postsCollection.doc(postId).delete();

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

// News endpoints
app.get('/api/news', async (req, res) => {
  try {
    const snapshot = await newsCollection
      .where('isPublished', '==', true)
      .orderBy('timestamp', 'desc')
      .limit(10)
      .get();

    const news = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(news);
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ error: 'Failed to get news' });
  }
});

app.get('/api/news/:newsId', async (req, res) => {
  try {
    const { newsId } = req.params;
    const doc = await newsCollection.doc(newsId).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'News not found' });
    }

    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Get news error:', error);
    res.status(500).json({ error: 'Failed to get news' });
  }
});

app.post('/api/news', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { title, content, author, category, imageUrl, isPublished } = req.body;

    if (!title || !content || !author) {
      return res.status(400).json({ error: 'Title, content, and author are required' });
    }

    const news = {
      title,
      content,
      author,
      category: category || 'general',
      imageUrl: imageUrl || null,
      isPublished: isPublished !== undefined ? isPublished : false,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await newsCollection.add(news);
    const createdNews = { id: docRef.id, ...news };

    res.status(201).json(createdNews);
  } catch (error) {
    console.error('Create news error:', error);
    res.status(500).json({ error: 'Failed to create news' });
  }
});

app.put('/api/news/:newsId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { newsId } = req.params;
    const { title, content, author, category, imageUrl, isPublished } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (author !== undefined) updates.author = author;
    if (category !== undefined) updates.category = category;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl;
    if (isPublished !== undefined) updates.isPublished = isPublished;

    await newsCollection.doc(newsId).update(updates);

    const doc = await newsCollection.doc(newsId).get();
    res.json({ id: doc.id, ...doc.data() });
  } catch (error) {
    console.error('Update news error:', error);
    res.status(500).json({ error: 'Failed to update news' });
  }
});

app.delete('/api/news/:newsId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { newsId } = req.params;

    await newsCollection.doc(newsId).delete();

    res.json({ message: 'News deleted successfully' });
  } catch (error) {
    console.error('Delete news error:', error);
    res.status(500).json({ error: 'Failed to delete news' });
  }
});

// Posts endpoints
app.get('/api/posts', async (req, res) => {
  try {
    const snapshot = await postsCollection
      .orderBy('timestamp', 'desc')
      .limit(20)
      .get();

    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json(posts);
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

app.post('/api/posts', authenticateToken, upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    let imageUrl = null;

    if (req.file) {
      // Upload image to Firebase Storage
      const fileName = `posts/${uuidv4()}-${Date.now()}-${req.file.originalname}`;
      const file = bucket.file(fileName);

      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      await file.makePublic();
      imageUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    }

    const post = {
      userId: req.user.id,
      userName: req.user.name,
      title,
      content,
      imageUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await postsCollection.add(post);

    res.status(201).json({ success: true, message: 'Post created successfully' });
  } catch (error) {
    console.error('Create post error:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// Chatbot endpoints
app.post('/api/chatbot/message', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message required' });
    }

    // Simulate bot processing
    await new Promise(resolve => setTimeout(resolve, 1500));

    const responses = [
      "Based on your question, I recommend examining the leaves for specific disease patterns. Early detection is crucial for effective treatment.",
      "For prevention, I suggest using resistant corn varieties and practicing crop rotation. Proper spacing between plants helps with air circulation.",
      "The best time to inspect crops is early morning or late evening when lighting conditions are optimal for symptom identification.",
      "Fungicide applications can be effective when applied at the first sign of disease. Always follow label instructions.",
      "Regular monitoring and maintaining proper field hygiene are essential for disease prevention."
    ];

    const suggestions = [
      "How to identify Northern Leaf Blight?",
      "What are the best prevention methods?",
      "Treatment options for Common Rust",
      "When is the best time to inspect crops?",
      "Organic fungicide recommendations"
    ];

    const response = {
      message: responses[Math.floor(Math.random() * responses.length)],
      suggestions: suggestions.slice(0, 3),
      timestamp: new Date().toISOString()
    };

    res.json(response);
  } catch (error) {
    res.status(500).json({ error: 'Chatbot response failed' });
  }
});

app.post('/api/chatbot/conversation', authenticateToken, async (req, res) => {
  try {
    const conversationId = uuidv4();
    res.json({ conversationId });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

app.get('/api/chatbot/history/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    // Return empty history for now - in production, this would fetch from database
    res.json([]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
});

// Export endpoints
app.get('/api/admin/export/:dataType', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { dataType } = req.params;
    const { format = 'json' } = req.query;

    let data;
    switch (dataType) {
      case 'users':
        const usersSnapshot = await usersCollection.get();
        data = usersSnapshot.docs.map(doc => {
          const userData = doc.data();
          const { password, ...userWithoutPassword } = userData;
          return { id: doc.id, ...userWithoutPassword };
        });
        break;
      case 'detections':
        const detectionsSnapshot = await detectionsCollection.get();
        data = detectionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      case 'posts':
        const postsSnapshot = await postsCollection.get();
        data = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        break;
      default:
        return res.status(400).json({ error: 'Invalid data type' });
    }

    if (format === 'csv') {
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${dataType}.csv`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=${dataType}.json`);
      res.json(data);
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export data' });
  }
});

app.get('/api/admin/export/user/:userId', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { userId } = req.params;
    const { format = 'json' } = req.query;

    const doc = await usersCollection.doc(userId).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = doc.data();
    const { password, ...userWithoutPassword } = userData;
    const user = { id: doc.id, ...userWithoutPassword };

    if (format === 'csv') {
      const csv = convertToCSV([user]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=user-${userId}.csv`);
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=user-${userId}.json`);
      res.json(user);
    }
  } catch (error) {
    console.error('Export user error:', error);
    res.status(500).json({ error: 'Failed to export user data' });
  }
});

app.get('/api/admin/export/system', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const { format = 'json' } = req.query;

    const [usersCount, detectionsCount, postsCount, newsCount] = await Promise.all([
      usersCollection.get().then(snap => snap.size),
      detectionsCollection.get().then(snap => snap.size),
      postsCollection.get().then(snap => snap.size),
      newsCollection.get().then(snap => snap.size)
    ]);

    const systemData = {
      users: usersCount,
      detections: detectionsCount,
      posts: postsCount,
      news: newsCount,
      exportDate: new Date().toISOString()
    };

    if (format === 'csv') {
      const csv = convertToCSV([systemData]);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=system-stats.csv');
      res.send(csv);
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=system-stats.json');
      res.json(systemData);
    }
  } catch (error) {
    console.error('Export system error:', error);
    res.status(500).json({ error: 'Failed to export system data' });
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (!data || data.length === 0) return '';
  
  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      return typeof value === 'string' ? `"${value}"` : value;
    }).join(',');
  });
  
  return [csvHeaders, ...csvRows].join('\n');
}

// Export the Express app as a Firebase Function
exports.api = functions.https.onRequest(app);
