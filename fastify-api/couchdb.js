import Fastify from 'fastify';
import nano from 'nano';

// Initialize Fastify
const fastify = Fastify();

// Connect to CouchDB
const couch = nano('http://localhost:5984');
const db = couch.db.use('blog');

// Ensure the database exists
couch.db.create('blog').catch(err => {
  if (err.statusCode !== 412) {
    console.error('Error creating database:', err);
  }
});

// Create a new post
fastify.post('/api/posts', async (req, reply) => {
  try {
    const response = await db.insert(req.body);
    reply.send(response);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Get all posts
fastify.get('/api/posts', async (req, reply) => {
  try {
    const response = await db.list({ include_docs: true });
    const posts = response.rows.map(row => row.doc);
    reply.send(posts);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Get a specific post by ID
fastify.get('/api/posts/:id', async (req, reply) => {
  try {
    const post = await db.get(req.params.id);
    reply.send(post);
  } catch (err) {
    if (err.statusCode === 404) {
      reply.code(404).send({ message: 'Post not found' });
    } else {
      reply.code(500).send(err);
    }
  }
});

// Update a post by ID
fastify.put('/api/posts/:id', async (req, reply) => {
  try {
    const post = await db.get(req.params.id);
    const updatedPost = { ...post, ...req.body };
    const response = await db.insert(updatedPost);
    reply.send(response);
  } catch (err) {
    if (err.statusCode === 404) {
      reply.code(404).send({ message: 'Post not found' });
    } else {
      reply.code(500).send(err);
    }
  }
});

// Delete a post by ID
fastify.delete('/api/posts/:id', async (req, reply) => {
  try {
    const post = await db.get(req.params.id);
    const response = await db.destroy(post._id, post._rev);
    reply.send({ message: 'Post deleted successfully', response });
  } catch (err) {
    if (err.statusCode === 404) {
      reply.code(404).send({ message: 'Post not found' });
    } else {
      reply.code(500).send(err);
    }
  }
});

// Search for posts
fastify.get('/api/posts/search', async (req, reply) => {
  try {
    const response = await db.find({
      selector: {
        $or: [
          { title: { $regex: `(?i).*${req.query.q}.*` } },
          { content: { $regex: `(?i).*${req.query.q}.*` } }
        ]
      }
    });
    reply.send(response.docs);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Start the server
fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});
