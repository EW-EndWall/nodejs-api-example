import Fastify from 'fastify';
import { Sequelize, DataTypes } from 'sequelize';

// Initialize Fastify
const fastify = Fastify();

// Connect to MySQL
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'mysql'
});

// Define the Post model
const Post = sequelize.define('Post', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Sync database
sequelize.sync();

// Create a new post
fastify.post('/api/posts', async (req, reply) => {
  try {
    const post = await Post.create(req.body);
    reply.send(post);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Get all posts
fastify.get('/api/posts', async (req, reply) => {
  try {
    const posts = await Post.findAll();
    reply.send(posts);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Get a specific post by ID
fastify.get('/api/posts/:id', async (req, reply) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
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
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      reply.code(404).send({ message: 'Post not found' });
      return;
    }
    await post.update(req.body);
    reply.send(post);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Delete a post by ID
fastify.delete('/api/posts/:id', async (req, reply) => {
  try {
    const post = await Post.findByPk(req.params.id);
    if (!post) {
      reply.code(404).send({ message: 'Post not found' });
      return;
    }
    await post.destroy();
    reply.send({ message: 'Post deleted successfully' });
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Search for posts
fastify.get('/api/posts/search', async (req, reply) => {
  try {
    const posts = await Post.findAll({
      where: {
        [Sequelize.Op.or]: [
          { title: { [Sequelize.Op.like]: `%${req.query.q}%` } },
          { content: { [Sequelize.Op.like]: `%${req.query.q}%` } }
        ]
      }
    });
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
