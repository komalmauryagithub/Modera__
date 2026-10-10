import mongoose from 'mongoose';

export const EVENT_CATEGORIES = [
  'General',
  'Birthday',
  'Anniversary',
  'Travel',
  'Milestone',
  'Holiday',
  'Romantic',
  'Family',
  'Other',
];

const eventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Event owner ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Event title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    caption: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Caption cannot exceed 1000 characters'],
    },
    date: {
      type: String,
      required: [true, 'Event date is required in YYYY-MM-DD format'],
      trim: true,
      match: [/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'],
    },
    time: {
      type: String,
      trim: true,
      default: null,
      validate: {
        validator: function (v) {
          if (!v) return true;
          return /^([01]\d|2[0-3]):([0-5]\d)$/.test(v);
        },
        message: 'Time must be in HH:mm 24-hour format (e.g. 14:30)',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: EVENT_CATEGORIES,
        message: '{VALUE} is not a valid category',
      },
      default: 'General',
    },
    imageUrl: {
      type: String,
      default: null,
    },
    imagePublicId: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Composite index for fast calendar month and range queries per user
eventSchema.index({ user: 1, date: 1 });

// Clean serialization to JSON
eventSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  obj.id = obj._id;
  return obj;
};

const Event = mongoose.model('Event', eventSchema);

export default Event;
