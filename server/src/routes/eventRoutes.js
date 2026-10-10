import express from 'express';
import {
  createEvent,
  getEvents,
  getUpcomingEvents,
  getEventById,
  updateEvent,
  deleteEvent,
} from '../controllers/eventController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadEventPhoto } from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Enforce authentication across all event routes
router.use(protect);

// Specific sub-routes (Registered before :id parameter to prevent route collision)
router.get('/upcoming', getUpcomingEvents);

// Collection routes
router.post('/', uploadEventPhoto, createEvent);
router.get('/', getEvents);

// Individual item routes
router.get('/:id', getEventById);
router.put('/:id', uploadEventPhoto, updateEvent);
router.delete('/:id', deleteEvent);

export default router;
