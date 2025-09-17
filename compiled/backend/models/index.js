"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuestionLegacy = exports.QuestionEnhancedV2 = exports.Attempt = exports.Question = exports.Test = exports.Material = exports.Subject = exports.Class = exports.User = void 0;
// Export all models
var User_1 = require("./User");
Object.defineProperty(exports, "User", { enumerable: true, get: function () { return User_1.default; } });
var Class_1 = require("./Class");
Object.defineProperty(exports, "Class", { enumerable: true, get: function () { return Class_1.default; } });
var Subject_1 = require("./Subject");
Object.defineProperty(exports, "Subject", { enumerable: true, get: function () { return Subject_1.default; } });
var Material_1 = require("./Material");
Object.defineProperty(exports, "Material", { enumerable: true, get: function () { return Material_1.default; } });
var Test_1 = require("./Test");
Object.defineProperty(exports, "Test", { enumerable: true, get: function () { return Test_1.default; } });
var QuestionEnhancedV2_1 = require("./QuestionEnhancedV2"); // Enhanced V2 is now the main Question model
Object.defineProperty(exports, "Question", { enumerable: true, get: function () { return QuestionEnhancedV2_1.default; } });
var Attempt_1 = require("./Attempt");
Object.defineProperty(exports, "Attempt", { enumerable: true, get: function () { return Attempt_1.default; } });
// Export enhanced models for direct access
var QuestionEnhancedV2_2 = require("./QuestionEnhancedV2");
Object.defineProperty(exports, "QuestionEnhancedV2", { enumerable: true, get: function () { return QuestionEnhancedV2_2.default; } });
// Export legacy for backwards compatibility
var Question_1 = require("./Question");
Object.defineProperty(exports, "QuestionLegacy", { enumerable: true, get: function () { return Question_1.default; } });
