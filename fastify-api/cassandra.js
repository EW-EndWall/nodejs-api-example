import Fastify from 'fastify';
import { Client } from 'cassandra-driver';
import { v4 as uuidv4 } from 'uuid';

// Initialize Fastify
const fastify = Fastify();

// Connect to Cassandra
const client = new Client({
  contactPoints: ['127.0.0.1'],
  localDataCenter: 'datacenter1',
  keyspace: 'blog'
});

// Ensure the keyspace and table exist
async function ensureSchema() {
  await client.execute(`
    CREATE KEYSPACE IF NOT EXISTS blog WITH REPLICATION = {
      'class': 'SimpleStrategy',
      'replication_factor': 1
    }
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS blog.posts (
      id UUID PRIMARY KEY,
      title TEXT,
      content TEXT,
      createdAt TIMESTAMP
    )
  `);
}

ensureSchema().then(() => console.log('Cassandra schema ensured')).catch(err => console.error('Cassandra schema error:', err));

// Create a new post
fastify.post('/api/posts', async (req, reply) => {
  try {
    const id = uuidv4();
    const createdAt = new Date();
    const query = 'INSERT INTO blog.posts (id, title, content, createdAt) VALUES (?, ?, ?, ?)';
    const params = [id, req.body.title, req.body.content, createdAt];
    await client.execute(query, params, { prepare: true });
    reply.send({ id, title: req.body.title, content: req.body.content, createdAt });
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Get all posts
fastify.get('/api/posts', async (req, reply) => {
  try {
    const query = 'SELECT * FROM blog.posts';
    const result = await client.execute(query);
    reply.send(result.rows);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Get a specific post by ID
fastify.get('/api/posts/:id', async (req, reply) => {
  try {
    const query = 'SELECT * FROM blog.posts WHERE id = ?';
    const params = [req.params.id];
    const result = await client.execute(query, params, { prepare: true });
    if (result.rowLength === 0) {
      reply.code(404).send({ message: 'Post not found' });
      return;
    }
    reply.send(result.rows[0]);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Update a post by ID
fastify.put('/api/posts/:id', async (req, reply) => {
  try {
    const query = 'UPDATE blog.posts SET title = ?, content = ? WHERE id = ?';
    const params = [req.body.title, req.body.content, req.params.id];
    await client.execute(query, params, { prepare: true });
    reply.send({ id: req.params.id, title: req.body.title, content: req.body.content });
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Delete a post by ID
fastify.delete('/api/posts/:id', async (req, reply) => {
  try {
    const query = 'DELETE FROM blog.posts WHERE id = ?';
    const params = [req.params.id];
    await client.execute(query, params, { prepare: true });
    reply.send({ message: 'Post deleted successfully' });
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Search for posts
fastify.get('/api/posts/search', async (req, reply) => {
  try {
    const query = 'SELECT * FROM blog.posts';
    const result = await client.execute(query);
    const searchTerm = req.query.q.toLowerCase();
    const posts = result.rows.filter(post => 
      post.title.toLowerCase().includes(searchTerm) || 
      post.content.toLowerCase().includes(searchTerm)
    );
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
