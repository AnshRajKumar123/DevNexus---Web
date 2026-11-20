const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, required: true, default: 'Pending Approval' },
    desc: { type: String, required: true },
    techStack: [{ type: String }],
    deadline: { type: String },
    createdBy: { type: String, required: true },

    liveUrl: { type: String, default: '' },
    isPrivate: { type: Boolean, default: false },
    restartRequests: [{ type: String }],
    comments: [{
        author: String,
        text: String,
        createdAt: { type: Date, default: Date.now }
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Project', projectSchema);