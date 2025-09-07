const express = require('express');
const { body } = require('express-validator');
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  getAllComments
} = require('../controllers/commentsController');
const { protect, optionalAuth, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const commentValidation = [
  body('postId')
    .notEmpty()
    .withMessage('Post ID is required'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content is required and must be less than 1000 characters'),
  body('username')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username is required and must be less than 50 characters'),
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('parentId')
    .optional()
    .notEmpty()
    .withMessage('Parent ID must not be empty if provided')
];

const updateCommentValidation = [
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content is required and must be less than 1000 characters')
];

// @route   GET /api/comments
// @desc    Get all comments (admin only)
// @access  Private (Admin)
router.get('/', protect, isAdmin, getAllComments);

// @route   GET /api/comments/:postId
// @desc    Get comments for a specific post
// @access  Public
router.get('/:postId', getComments);

// @route   POST /api/comments
// @desc    Create new comment
// @access  Public (with optional authentication)
router.post('/', optionalAuth, commentValidation, validate, createComment);

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private (Comment owner/Admin)
router.put('/:id', protect, updateCommentValidation, validate, updateComment);

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private (Comment owner/Admin)
router.delete('/:id', protect, deleteComment);

module.exports = router;