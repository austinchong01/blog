const express = require('express');
const { body } = require('express-validator');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getUserStats
} = require('../controllers/usersController');
const { protect, isAdmin } = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// Validation rules
const updateUserValidation = [
  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('username')
    .optional()
    .isLength({ min: 3, max: 20 })
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username must be 3-20 characters and contain only letters, numbers, and underscores'),
  body('password')
    .optional()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['USER', 'AUTHOR', 'ADMIN'])
    .withMessage('Role must be USER, AUTHOR, or ADMIN')
];

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin)
router.get('/', protect, isAdmin, getUsers);

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Admin or own profile)
router.get('/:id', protect, getUser);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Admin or own profile)
router.put('/:id', protect, updateUserValidation, validate, updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private (Admin only)
router.delete('/:id', protect, isAdmin, deleteUser);

// @route   GET /api/users/:id/stats
// @desc    Get user statistics
// @access  Private (Admin or own profile)
router.get('/:id/stats', protect, getUserStats);

module.exports = router;