const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
    name: { type: String, required: true },
    role: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: String,
    imgUrl: String,
    isSupremeAdmin: { type: Boolean, default: false },
    lastSeen: { type: Date, default: Date.now },
    fcmToken: { type: String, default: null }, // Replaced pushSubscription with Firebase Token
    createdAt: { type: Date, default: Date.now },
    password: { type: String, required: true }
});

const WebsiteSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    desc: String,
    img: String,

    devices: { type: [String], default: ['Desktop', 'Mobile'] },
    isPrivate: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const InquirySchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: String,
    assignedTo: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    reportedBy: String,
    date: String,
    createdAt: { type: Date, default: Date.now }
});

const EventSchema = new mongoose.Schema({
    title: { type: String, required: true },
    date: { type: String, required: true },
    time: { type: String, required: true },
    createdBy: { type: String, required: true },
    type: { type: String, default: 'Google Meet' },
    createdAt: { type: Date, default: Date.now }
});

const LinkSchema = new mongoose.Schema({
    title: { type: String, required: true },
    url: { type: String, required: true },
    createdBy: { type: String },
    createdAt: { type: Date, default: Date.now }
});

const TodoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
    userName: { type: String, required: true },
    title: { type: String, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    createdAt: { type: Date, default: Date.now }
});

const IntegrationSchema = new mongoose.Schema({
    appName: { type: String, required: true, unique: true },
    apiKey: { type: String, required: true },
    apiSecret: { type: String },
    connectedBy: { type: String },
    status: { type: String, default: 'Connected' },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = {
    Team: mongoose.model('Team', TeamSchema),
    Website: mongoose.model('Website', WebsiteSchema),
    Inquiry: mongoose.model('Inquiry', InquirySchema),
    Event: mongoose.model('Event', EventSchema),
    Link: mongoose.model('Link', LinkSchema),
    Todo: mongoose.model('Todo', TodoSchema),
    Integration: mongoose.model('Integration', IntegrationSchema),
};