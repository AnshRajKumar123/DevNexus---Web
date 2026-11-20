const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['inquiry', 'website', 'project', 'link', 'calendar', 'general'],
            default: 'general'
        },
        title: {
            type: String,
            required: true,
            trim: true
        },
        message: {
            type: String,
            default: ''
        },
        createdBy: {
            type: String,
            default: 'Team Member'
        },
        path: {
            type: String,
            default: '/'
        },
        // Tracks which users have read or cleared this notification
        readBy: {
            type: [String],
            default: []
        },
        deletedFor: {
            type: [String],
            default: []
        }
    },
    { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);