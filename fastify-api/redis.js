import Fastify from 'fastify';
import { createClient } from 'redis';
import { v4 as uuidv4 } from 'uuid';

// Initialize Fastify
const fastify = Fastify();

// Connect to Redis
const redisClient = createClient();
redisClient.connect().then(() => console.log('Redis connected successfully')).catch(err => console.error('Redis connection error:', err));

// Create a new post
fastify.post('/api/posts', async (req, reply) => {
  try {
    const id = uuidv4();
    const post = { id, ...req.body, createdAt: new Date().toISOString() };
    await redisClient.hSet(`post:${id}`, post);
    reply.send(post);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Get all posts
fastify.get('/api/posts', async (req, reply) => {
  try {
    const keys = await redisClient.keys('post:*');
    const posts = [];
    for (const key of keys) {
      const post = await redisClient.hGetAll(key);
      posts.push(post);
    }
    reply.send(posts);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Get a specific post by ID
fastify.get('/api/posts/:id', async (req, reply) => {
  try {
    const post = await redisClient.hGetAll(`post:${req.params.id}`);
    if (!post || Object.keys(post).length === 0) {
      reply.code(404).send({ message: 'Post not found' });
      return;
    }
    reply.send(post);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Update a post by ID
fastify.put('/api/posts/:id', async (req, reply) => {
  try {
    const post = await redisClient.hGetAll(`post:${req.params.id}`);
    if (!post || Object.keys(post).length === 0) {
      reply.code(404).send({ message: 'Post not found' });
      return;
    }
    const updatedPost = { ...post, ...req.body };
    await redisClient.hSet(`post:${req.params.id}`, updatedPost);
    reply.send(updatedPost);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Delete a post by ID
fastify.delete('/api/posts/:id', async (req, reply) => {
  try {
    const result = await redisClient.del(`post:${req.params.id}`);
    if (result === 0) {
      reply.code(404).send({ message: 'Post not found' });
      return;
    }
    reply.send({ message: 'Post deleted successfully' });
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Search for posts
fastify.get('/api/posts/search', async (req, reply) => {
  try {
    const keys = await redisClient.keys('post:*');
    const posts = [];
    for (const key of keys) {
      const post = await redisClient.hGetAll(key);
      if (post.title.includes(req.query.q) || post.content.includes(req.query.q)) {
        posts.push(post);
      }
    }
    reply.send(posts);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Start the server
fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});
