import Fastify from "fastify";
import mongoose from "mongoose";

// Initialize Fastify
const fastify = Fastify();

// Connect to MongoDB
mongoose
  .connect("mongodb://localhost/blog")
  .then(() => console.log("MongoDB connected successfully"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define the Post model
const Post = mongoose.model("Post", {
  title: String,
  content: String,
  createdAt: { type: Date, default: Date.now },
});

// Create a new post
fastify.post("/api/posts", async (req, reply) => {
  try {
    const post = new Post(req.body);
    await post.save();
    reply.send(post);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Get all posts
fastify.get("/api/posts", async (req, reply) => {
  try {
    const posts = await Post.find();
    reply.send(posts);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Get a specific post by ID
fastify.get("/api/posts/:id", async (req, reply) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      reply.code(404).send({ message: "Post not found" });
      return;
    }
    reply.send(post);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Update a post by ID
fastify.put("/api/posts/:id", async (req, reply) => {
  try {
    const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!post) {
      reply.code(404).send({ message: "Post not found" });
      return;
    }
    reply.send(post);
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Delete a post by ID
fastify.delete("/api/posts/:id", async (req, reply) => {
  try {
    const post = await Post.findByIdAndDelete(req.params.id);
    if (!post) {
      reply.code(404).send({ message: "Post not found" });
      return;
    }
    reply.send({ message: "Post deleted successfully" });
  } catch (err) {
    reply.code(500).send(err);
  }
});

// Search for posts
fastify.get("/api/posts/search", async (req, reply) => {
  try {
    const posts = await Post.find({ $text: { $search: req.query.q } });
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
