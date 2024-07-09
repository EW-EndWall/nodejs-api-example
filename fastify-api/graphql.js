import Fastify from 'fastify';
import { Sequelize, DataTypes } from 'sequelize';
import mercurius from 'mercurius';
import { v4 as uuidv4 } from 'uuid';

// Initialize Fastify
const fastify = Fastify();

// Connect to PostgreSQL
const sequelize = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'postgres'
});

// Define the Post model
const Post = sequelize.define('Post', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
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

// GraphQL schema
const schema = `
  type Post {
    id: String!
    title: String!
    content: String!
    createdAt: String!
  }

  type Query {
    getPost(id: String!): Post
    getPosts: [Post]
    searchPosts(query: String!): [Post]
  }

  type Mutation {
    createPost(title: String!, content: String!): Post
    updatePost(id: String!, title: String, content: String): Post
    deletePost(id: String!): String
  }
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    getPost: async (_, { id }) => {
      return await Post.findByPk(id);
    },
    getPosts: async () => {
      return await Post.findAll();
    },
    searchPosts: async (_, { query }) => {
      return await Post.findAll({
        where: {
          [Sequelize.Op.or]: [
            { title: { [Sequelize.Op.iLike]: `%${query}%` } },
            { content: { [Sequelize.Op.iLike]: `%${query}%` } }
          ]
        }
      });
    }
  },
  Mutation: {
    createPost: async (_, { title, content }) => {
      const post = await Post.create({ id: uuidv4(), title, content });
      return post;
    },
    updatePost: async (_, { id, title, content }) => {
      const post = await Post.findByPk(id);
      if (!post) throw new Error('Post not found');
      await post.update({ title, content });
      return post;
    },
    deletePost: async (_, { id }) => {
      const post = await Post.findByPk(id);
      if (!post) throw new Error('Post not found');
      await post.destroy();
      return 'Post deleted successfully';
    }
  }
};

// Register the GraphQL plugin
fastify.register(mercurius, {
  schema,
  resolvers,
  graphiql: true
});

// Start the server
fastify.listen(3000, (err, address) => {
  if (err) throw err;
  console.log(`Server listening on ${address}`);
});
