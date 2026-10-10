import mongoose from 'mongoose';
import Event, { EVENT_CATEGORIES } from '../models/Event.js';
import { isValidCalendarDate, isValidYearMonth } from '../utils/dateValidator.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../utils/cloudinaryHelper.js';

/**
 * Escapes regex special characters to prevent ReDoS or malformed query attacks
 */
const escapeRegex = (str) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * @desc    Create a new event with optional photo upload
 * @route   POST /api/events
 * @access  Private
 */
export const createEvent = async (req, res, next) => {
  try {
    const { title, caption, date, time, category } = req.body;

    // Validate Title
    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Event title is required.',
      });
    }

    if (title.trim().length > 120) {
      return res.status(400).json({
        success: false,
        message: 'Event title cannot exceed 120 characters.',
      });
    }

    // Validate Date (strict calendar date YYYY-MM-DD)
    if (!date || !isValidCalendarDate(date.trim())) {
      return res.status(400).json({
        success: false,
        message: 'A valid calendar date in YYYY-MM-DD format is required.',
      });
    }

    // Validate Time if provided
    let formattedTime = null;
    if (time && typeof time === 'string' && time.trim() !== '') {
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time.trim())) {
        return res.status(400).json({
          success: false,
          message: 'Event time must be in HH:mm 24-hour format (e.g., 14:30).',
        });
      }
      formattedTime = time.trim();
    }

    // Validate Category
    const selectedCategory = category ? category.trim() : 'General';
    if (!EVENT_CATEGORIES.includes(selectedCategory)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category. Allowed categories: ${EVENT_CATEGORIES.join(', ')}`,
      });
    }

    // Handle photo upload if present
    let imageUrl = null;
    let imagePublicId = null;

    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, 'memora_events', {
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
        });
        imageUrl = uploadResult.secure_url;
        imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload event photo to Cloudinary.',
          error: uploadError.message,
        });
      }
    }

    // Create event attached to authenticated user
    const event = await Event.create({
      user: req.user._id,
      title: title.trim(),
      caption: caption && typeof caption === 'string' ? caption.trim() : '',
      date: date.trim(),
      time: formattedTime,
      category: selectedCategory,
      imageUrl,
      imagePublicId,
    });

    return res.status(201).json({
      success: true,
      message: 'Event created successfully.',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get user's events with optional filtering (month, search, category, date range)
 * @route   GET /api/events
 * @access  Private
 */
export const getEvents = async (req, res, next) => {
  try {
    const { month, search, category, startDate, endDate } = req.query;

    // Base query strictly enforces ownership
    const query = { user: req.user._id };

    // Month filter (YYYY-MM)
    if (month) {
      if (!isValidYearMonth(month)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid month format. Expected YYYY-MM (e.g. 2026-10).',
        });
      }
      query.date = { $regex: `^${month}-` };
    }

    // Date range filter
    if (startDate || endDate) {
      query.date = query.date || {};
      if (startDate) {
        if (!isValidCalendarDate(startDate)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid startDate format. Expected YYYY-MM-DD.',
          });
        }
        query.date.$gte = startDate;
      }
      if (endDate) {
        if (!isValidCalendarDate(endDate)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid endDate format. Expected YYYY-MM-DD.',
          });
        }
        query.date.$lte = endDate;
      }
    }

    // Category filter
    if (category && category !== 'All') {
      query.category = category;
    }

    // Search query on title and caption (with regex escaping and length cap)
    if (search && typeof search === 'string' && search.trim() !== '') {
      const sanitized = escapeRegex(search.trim().substring(0, 80));
      query.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { caption: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const events = await Event.find(query).sort({ date: 1, time: 1, createdAt: 1 });

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get upcoming events for authenticated user (today onwards)
 * @route   GET /api/events/upcoming
 * @access  Private
 */
export const getUpcomingEvents = async (req, res, next) => {
  try {
    // Current date formatted as YYYY-MM-DD
    const todayStr = new Date().toISOString().split('T')[0];

    const limit = parseInt(req.query.limit, 10) || 10;
    const safeLimit = Math.min(Math.max(limit, 1), 50);

    const events = await Event.find({
      user: req.user._id,
      date: { $gte: todayStr },
    })
      .sort({ date: 1, time: 1 })
      .limit(safeLimit);

    return res.status(200).json({
      success: true,
      count: events.length,
      events,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Private
 */
export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await Event.findOne({ _id: id, user: req.user._id });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found.',
      });
    }

    return res.status(200).json({
      success: true,
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update an existing event with optional photo replacement/removal
 * @route   PUT /api/events/:id
 * @access  Private
 */
export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await Event.findOne({ _id: id, user: req.user._id });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you are not authorized to edit it.',
      });
    }

    const { title, caption, date, time, category, removePhoto } = req.body;

    // Validate updated title if provided
    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Event title cannot be empty.',
        });
      }
      if (title.trim().length > 120) {
        return res.status(400).json({
          success: false,
          message: 'Event title cannot exceed 120 characters.',
        });
      }
      event.title = title.trim();
    }

    // Validate updated date if provided
    if (date !== undefined) {
      if (!isValidCalendarDate(date.trim())) {
        return res.status(400).json({
          success: false,
          message: 'A valid calendar date in YYYY-MM-DD format is required.',
        });
      }
      event.date = date.trim();
    }

    // Validate updated time if provided
    if (time !== undefined) {
      if (time && time.trim() !== '') {
        if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(time.trim())) {
          return res.status(400).json({
            success: false,
            message: 'Event time must be in HH:mm 24-hour format (e.g., 14:30).',
          });
        }
        event.time = time.trim();
      } else {
        event.time = null;
      }
    }

    // Validate updated category if provided
    if (category !== undefined) {
      if (!EVENT_CATEGORIES.includes(category.trim())) {
        return res.status(400).json({
          success: false,
          message: `Invalid category. Allowed categories: ${EVENT_CATEGORIES.join(', ')}`,
        });
      }
      event.category = category.trim();
    }

    // Update caption if provided
    if (caption !== undefined) {
      event.caption = typeof caption === 'string' ? caption.trim() : '';
    }

    // Handle photo replacement or removal
    if (req.file) {
      // Replaced with a new photo
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, 'memora_events', {
          mimetype: req.file.mimetype,
          originalname: req.file.originalname,
        });

        // Delete old image from Cloudinary safely
        if (event.imagePublicId) {
          await deleteFromCloudinary(event.imagePublicId);
        }

        event.imageUrl = uploadResult.secure_url;
        event.imagePublicId = uploadResult.public_id;
      } catch (uploadError) {
        return res.status(500).json({
          success: false,
          message: 'Failed to upload replacement photo to Cloudinary.',
          error: uploadError.message,
        });
      }
    } else if (removePhoto === 'true' || removePhoto === true) {
      // User explicitly requested photo removal
      if (event.imagePublicId) {
        await deleteFromCloudinary(event.imagePublicId);
      }
      event.imageUrl = null;
      event.imagePublicId = null;
    }

    await event.save();

    return res.status(200).json({
      success: true,
      message: 'Event updated successfully.',
      event,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an event and clean up associated Cloudinary image
 * @route   DELETE /api/events/:id
 * @access  Private
 */
export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid event ID format.',
      });
    }

    const event = await Event.findOne({ _id: id, user: req.user._id });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or you are not authorized to delete it.',
      });
    }

    // Clean up Cloudinary asset if present
    if (event.imagePublicId) {
      await deleteFromCloudinary(event.imagePublicId);
    }

    await event.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Event deleted successfully.',
    });
  } catch (error) {
    next(error);
  }
};
