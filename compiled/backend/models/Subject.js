"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ChapterSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Chapter name is required'],
        trim: true,
        maxlength: [100, 'Chapter name cannot exceed 100 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    topics: [{
            type: String,
            trim: true,
            maxlength: [100, 'Topic name cannot exceed 100 characters']
        }],
    isActive: {
        type: Boolean,
        default: true
    }
});
const SubjectSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: [true, 'Subject name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Subject name cannot exceed 50 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    classNumbers: [{
            type: Number,
            min: 5,
            max: 10,
            required: true
        }],
    icon: {
        type: String,
        default: 'book'
    },
    color: {
        type: String,
        default: '#3b82f6'
    },
    chapters: {
        type: Map,
        of: [ChapterSchema],
        default: new Map()
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.models.Subject || mongoose_1.default.model('Subject', SubjectSchema);
