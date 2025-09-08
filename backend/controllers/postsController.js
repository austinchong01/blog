const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Helper function to generate slug from title
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim("-");
};

// @desc    Get all published posts
// @route   GET /api/posts
// @access  Public
const getPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {
      published: true,
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { publishedAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get all posts (including drafts) - Any authenticated user
// @route   GET /api/posts/all
// @access  Private (Any authenticated user)
const getAllPosts = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (status === "published") where.published = true;
    if (status === "draft") where.published = false;

    // REMOVED: Role-based filtering - now any authenticated user can see all posts

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          _count: {
            select: { comments: true },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.post.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        posts,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all posts error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get single post by slug
// @route   GET /api/posts/:slug
// @access  Public (published) / Private (drafts)
const getPost = async (req, res) => {
  try {
    const { slug } = req.params;

    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
        comments: {
          where: { parentId: null }, // Only top-level comments
          include: {
            replies: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                  },
                },
              },
              orderBy: { createdAt: "asc" },
            },
            user: {
              select: {
                id: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // If post is not published, only authenticated users can see it
    if (!post.published) {
      if (!req.user) {
        return res.status(404).json({
          success: false,
          message: "Post not found",
        });
      }
    }

    res.json({
      success: true,
      data: { post },
    });
  } catch (error) {
    console.error("Get post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Create new post
// @route   POST /api/posts
// @access  Private (Any authenticated user)
const createPost = async (req, res) => {
  try {
    const { title, content, published = false } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    // Generate unique slug
    let slug = generateSlug(title);
    const existingPost = await prisma.post.findUnique({ where: { slug } });
    if (existingPost) {
      slug = `${slug}-${Date.now()}`;
    }

    const post = await prisma.post.create({
      data: {
        title,
        content,
        slug,
        published,
        publishedAt: published ? new Date() : null,
        authorId: req.user.id,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: `Post ${
        published ? "published" : "saved as draft"
      } successfully`,
      data: { post },
    });
  } catch (error) {
    console.error("Create post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update post
// @route   PUT /api/posts/:id
// @access  Private (Any authenticated user)
const updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, published } = req.body;

    const existingPost = await prisma.post.findUnique({
      where: { id },
    });

    if (!existingPost) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // REMOVED: Role-based authorization check - any authenticated user can edit any post

    const updateData = {};
    if (title) {
      updateData.title = title;
      // Update slug if title changed
      if (title !== existingPost.title) {
        updateData.slug = generateSlug(title);
        // Ensure unique slug
        const slugExists = await prisma.post.findFirst({
          where: { slug: updateData.slug, NOT: { id } },
        });
        if (slugExists) {
          updateData.slug = `${updateData.slug}-${Date.now()}`;
        }
      }
    }
    if (content !== undefined) updateData.content = content;
    if (published !== undefined) {
      updateData.published = published;
      // Set publishedAt when publishing for the first time
      if (published && !existingPost.published) {
        updateData.publishedAt = new Date();
      }
    }

    const post = await prisma.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            email: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Post updated successfully",
      data: { post },
    });
  } catch (error) {
    console.error("Update post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete post
// @route   DELETE /api/posts/:id
// @access  Private (Any authenticated user)
const deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await prisma.post.findUnique({
      where: { id },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // REMOVED: Role-based authorization check - any authenticated user can delete any post

    await prisma.post.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getPosts,
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
};