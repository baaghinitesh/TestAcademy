"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const ClassSchema = new mongoose_1.Schema({
    number: {
        type: Number,
        required: [true, 'Class number is required'],
        unique: true,
        min: [5, 'Class must be between 5 and 10'],
        max: [10, 'Class must be between 5 and 10']
    },
    name: {
        type: String,
        required: [true, 'Class name is required'],
        trim: true,
        maxlength: [50, 'Class name cannot exceed 50 characters']
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters']
    },
    subjects: [{
            type: String,
            required: true
        }],
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
exports.default = mongoose_1.default.models.Class || mongoose_1.default.model('Class', ClassSchema);
