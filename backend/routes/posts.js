const express = require('express');
const { body } = require('express-validator');
const {
  getPosts,
  getAllPosts,
  getPost,
  createPost,
  updatePost,
  deletePost
} = require('../controllers/postsController');
const { protect, optionalAuth } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const postValidation = [
  body('title')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Title is required and must be less than 200 characters'),
  body('content')
    .trim()
    .isLength({ min: 1 })
    .withMessage('Content is required'),
  body('published')
    .optional()
    .isBoolean()
    .withMessage('Published must be a boolean value')
];

// @route   GET /api/posts
// @desc    Get all published posts (public)
// @access  Public
router.get('/', getPosts);

// @route   GET /api/posts/all
// @desc    Get all posts including drafts (any authenticated user)
// @access  Private (Any authenticated user)
router.get('/all', protect, getAllPosts);

// @route   GET /api/posts/:slug
// @desc    Get single post by slug
// @access  Public for published, Private for drafts
router.get('/:slug', optionalAuth, getPost);

// @route   POST /api/posts
// @desc    Create new post
// @access  Private (Any authenticated user)
router.post('/', protect, postValidation, validate, createPost);

// @route   PUT /api/posts/:id
// @desc    Update post
// @access  Private (Any authenticated user)
router.put('/:id', protect, postValidation, validate, updatePost);

// @route   DELETE /api/posts/:id
// @desc    Delete post
// @access  Private (Any authenticated user)
router.delete('/:id', protect, deletePost);

module.exports = router;