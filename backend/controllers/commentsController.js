const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// @desc    Get comments for a post
// @route   GET /api/comments/:postId
// @access  Public
const getComments = async (req, res) => {
  try {
    const { postId } = req.params;

    // Check if post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, published: true },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!post.published) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comments = await prisma.comment.findMany({
      where: {
        postId,
        parentId: null, // Only top-level comments
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
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
      },
      orderBy: { createdAt: "desc" },
    });

    res.json({
      success: true,
      data: { comments },
    });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Create new comment
// @route   POST /api/comments
// @access  Public
const createComment = async (req, res) => {
  try {
    const { postId, content, username, email, parentId } = req.body;

    if (!postId || !content || !username) {
      return res.status(400).json({
        success: false,
        message: "Post ID, content, and username are required",
      });
    }

    // Check if post exists and is published
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true, published: true },
    });

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (!post.published) {
      return res.status(404).json({
        success: false,
        message: "Cannot comment on unpublished post",
      });
    }

    // If parentId is provided, check if parent comment exists
    if (parentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parentId },
        select: { id: true, postId: true },
      });

      if (!parentComment || parentComment.postId !== postId) {
        return res.status(404).json({
          success: false,
          message: "Parent comment not found",
        });
      }
    }

    const commentData = {
      content: content.trim(),
      username: username.trim(),
      postId,
      ...(email && { email: email.trim() }),
      ...(parentId && { parentId }),
      ...(req.user && { userId: req.user.id }),
    };

    const comment = await prisma.comment.create({
      data: commentData,
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      message: "Comment created successfully",
      data: { comment },
    });
  } catch (error) {
    console.error("Create comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Update comment
// @route   PUT /api/comments/:id
// @access  Private (Comment owner/Admin)
const updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const comment = await prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user can edit this comment
    const canEdit =
      req.user.role === "ADMIN" ||
      (comment.userId && comment.userId === req.user.id);

    if (!canEdit) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this comment",
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        content: content.trim(),
        updatedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    res.json({
      success: true,
      message: "Comment updated successfully",
      data: { comment: updatedComment },
    });
  } catch (error) {
    console.error("Update comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (Comment owner/Admin)
const deleteComment = async (req, res) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        replies: true,
      },
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user can delete this comment
    const canDelete =
      req.user.role === "ADMIN" ||
      (comment.userId && comment.userId === req.user.id);

    if (!canDelete) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    // Delete comment and all replies (cascade delete handled by Prisma schema)
    await prisma.comment.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

// @desc    Get all comments (Admin only)
// @route   GET /api/comments
// @access  Private (Admin)
const getAllComments = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
          post: {
            select: {
              id: true,
              title: true,
              slug: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: parseInt(limit),
      }),
      prisma.comment.count(),
    ]);

    res.json({
      success: true,
      data: {
        comments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
        },
      },
    });
  } catch (error) {
    console.error("Get all comments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  getAllComments,
};
