const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please add a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    select: false,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  schedule: {
    type: [{
      day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
      active: { type: Boolean, default: false },
      timeSlots: [{
         hours: { type: Number, default: 1 },
         startTime: { type: String, default: "09:00" }
      }]
    }],
    default: [
      { day: 'Monday', active: false, timeSlots: [] },
      { day: 'Tuesday', active: false, timeSlots: [] },
      { day: 'Wednesday', active: false, timeSlots: [] },
      { day: 'Thursday', active: false, timeSlots: [] },
      { day: 'Friday', active: false, timeSlots: [] },
      { day: 'Saturday', active: false, timeSlots: [] },
      { day: 'Sunday', active: false, timeSlots: [] }
    ]
  },
  hasSetupSchedule: {
    type: Boolean,
    default: false
  },
  activityLogs: [
    {
      date: { type: String, required: true }, // Format: YYYY-MM-DD
      minutes: { type: Number, default: 0 },
      videosCompleted: { type: Number, default: 0 }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Encrypt password using bcrypt
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
