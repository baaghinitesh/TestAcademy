"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const AnswerSchema = new mongoose_1.Schema({
    questionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Question',
        required: [true, 'Question ID is required']
    },
    selectedOptions: [{
            type: Number,
            min: [0, 'Option index cannot be negative']
        }],
    isCorrect: {
        type: Boolean,
        default: false
    },
    marksObtained: {
        type: Number,
        default: 0,
        min: [0, 'Marks obtained cannot be negative']
    },
    timeSpent: {
        type: Number,
        default: 0,
        min: [0, 'Time spent cannot be negative']
    }
});
const AttemptSchema = new mongoose_1.Schema({
    test: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Test',
        required: [true, 'Test reference is required']
    },
    student: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student reference is required']
    },
    attemptNumber: {
        type: Number,
        required: [true, 'Attempt number is required'],
        min: [1, 'Attempt number must be at least 1']
    },
    answers: [AnswerSchema],
    startTime: {
        type: Date,
        required: [true, 'Start time is required'],
        default: Date.now
    },
    endTime: {
        type: Date
    },
    submittedTime: {
        type: Date
    },
    totalTimeSpent: {
        type: Number,
        default: 0,
        min: [0, 'Total time spent cannot be negative']
    },
    score: {
        type: Number,
        default: 0,
        min: [0, 'Score cannot be negative']
    },
    percentage: {
        type: Number,
        default: 0,
        min: [0, 'Percentage cannot be negative'],
        max: [100, 'Percentage cannot exceed 100']
    },
    totalMarks: {
        type: Number,
        required: [true, 'Total marks is required'],
        min: [0, 'Total marks cannot be negative']
    },
    marksObtained: {
        type: Number,
        default: 0,
        min: [0, 'Marks obtained cannot be negative']
    },
    isPassed: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['in-progress', 'completed', 'auto-submitted', 'abandoned'],
        default: 'in-progress'
    },
    autoSaveData: {
        type: mongoose_1.Schema.Types.Mixed,
        default: {}
    },
    lastAutoSave: {
        type: Date,
        default: Date.now
    },
    isReviewed: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});
// Compound index to ensure unique attempts per student per test (considering attempt number)
AttemptSchema.index({ test: 1, student: 1, attemptNumber: 1 }, { unique: true });
// Index for better query performance
AttemptSchema.index({ student: 1, status: 1 });
AttemptSchema.index({ test: 1, status: 1 });
exports.default = mongoose_1.default.models.Attempt || mongoose_1.default.model('Attempt', AttemptSchema);
