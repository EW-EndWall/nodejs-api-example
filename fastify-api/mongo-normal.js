const fastify = require('fastify')();
const mongoose = require('mongoose');

// MongoDB bağlantısı
mongoose.connect('mongodb://localhost/blog', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => console.log('MongoDB bağlantısı başarılı'))
  .catch(err => console.error('MongoDB bağlantı hatası:', err));

// Post modeli
const Post = mongoose.model('Post', {
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now }
});

// Yeni bir post oluştur
fastify.post('/api/posts', async (req, reply) => {
  try {
    const post = new Post(req.body);
    await post.save();
    reply.send(post);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Tüm postları getir
fastify.get('/api/posts', async (req, reply) => {
  try {
    const posts = await Post.find();
    reply.send(posts);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Belirli bir postu getir
fastify.get('/api/posts/:id', async (req, reply) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      reply.code(404).send({ message: 'Post not found' });
      return;
    }
    reply.send(post);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Bir postu güncelle
fastify.put('/api/posts/:id', async (req, reply) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!post) {
      reply.code(404).send({ message: 'Post not found' });
      return;
    }
    reply.send(post);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Bir postu sil
fastify.delete('/api/posts/:id', async (req, reply) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      reply.code(404).send({ message: 'Post not found' });
      return;
    }
    reply.send({ message: 'Post deleted successfully' });
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Bir post ara
fastify.get('/api/posts/search', async (req, reply) => {
  try {
    const posts = await Post.find({ $text: { $search: req.query.q } });
    reply.send(posts);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Server'ı başlat
fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});
