const express = require('express');
const { body, validationResult } = require('express-validator');
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  getAllComments
} = require('../controllers/commentsController');
const { protect, isAdmin } = require('../middleware/auth');

const router = express.Router();

// Custom validation middleware with better error reporting
const validateWithDebug = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array());
    console.log('Request body:', req.body);
    
    const errorMessages = errors.array().map(error => ({
      field: error.path || error.param,
      message: error.msg,
      value: error.value,
      location: error.location
    }));

    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errorMessages,
      receivedData: req.body
    });
  }

  next();
};

// Validation rules for creating comments
const commentValidation = [
  body('postId')
    .notEmpty()
    .withMessage('Post ID is required'),
  body('content')
    .trim()
    .isLength({ min: 1, max: 1000 })
    .withMessage('Content is required and must be less than 1000 characters'),
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
// @access  Private (Authentication required)
router.post('/', protect, commentValidation, validateWithDebug, createComment);

// @route   PUT /api/comments/:id
// @desc    Update comment
// @access  Private (Comment owner/Admin)
router.put('/:id', protect, updateCommentValidation, validateWithDebug, updateComment);

// @route   DELETE /api/comments/:id
// @desc    Delete comment
// @access  Private (Comment owner/Admin)
router.delete('/:id', protect, deleteComment);

module.exports = router;