import mongoose, { Schema, Document } from 'mongoose';

// Content metadata for rich text and formatted content
export interface IContentMetadata {
  wordCount?: number;
  readingTime?: number; // estimated minutes
  lastModified?: Date;
  version?: string;
  tags?: string[];
}

// File metadata for uploaded files
export interface IFileMetadata {
  originalName: string;
  mimeType: string;
  encoding?: string;
  size: number;
  path: string;
  url?: string;
  thumbnailUrl?: string;
  pages?: number; // for PDFs
  duration?: number; // for videos
  checksum?: string;
  uploadedAt: Date;
}

// Enhanced Material interface
export interface IMaterialEnhanced extends Document {
  title: string;
  description?: string;
  
  // Content types and storage
  contentType: 'text' | 'pdf' | 'video' | 'image' | 'audio' | 'url' | 'mixed';
  
  // Rich text content (stored directly in DB for searchability)
  textContent?: string; // Raw text content
  htmlContent?: string; // Rich formatted HTML content
  markdownContent?: string; // Markdown formatted content
  
  // File storage (for uploaded files)
  files: IFileMetadata[]; // Support multiple files per material
  primaryFile?: string; // ID of the main file
  
  // External content
  externalUrl?: string; // For linked external resources
  embedCode?: string; // For embedded content (YouTube, etc.)
  
  // Enhanced categorization
  subject: mongoose.Types.ObjectId;
  classNumber: number;
  chapter?: string;
  topic?: string;
  subtopic?: string;
  
  // Content difficulty and prerequisites
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisites: string[]; // Topics that should be learned first
  learningObjectives: string[]; // What students will learn
  
  // Content metadata
  metadata: IContentMetadata;
  
  // Access control and permissions
  isPublished: boolean;
  isActive: boolean;
  downloadable: boolean;
  viewable: boolean;
  requiresLogin: boolean;
  allowedRoles: ('student' | 'teacher' | 'admin')[];
  
  // Analytics and engagement
  viewCount: number;
  downloadCount: number;
  favoriteCount: number;
  averageRating: number;
  ratingCount: number;
  
  // Interactive features
  hasQuiz: boolean; // Whether it has associated quiz questions
  hasDiscussion: boolean; // Whether discussion is enabled
  allowComments: boolean;
  
  // Organization and workflow
  status: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  reviewNotes?: string;
  
  // Version control
  version: string;
  parentVersion?: mongoose.Types.ObjectId;
  isLatestVersion: boolean;
  
  // Scheduling
  publishAt?: Date;
  unpublishAt?: Date;
  
  // Creator and ownership
  createdBy: mongoose.Types.ObjectId;
  lastModifiedBy?: mongoose.Types.ObjectId;
  collaborators: mongoose.Types.ObjectId[];
  
  // SEO and discoverability
  slug?: string;
  keywords: string[];
  searchableContent?: string; // Processed content for search
  
  createdAt: Date;
  updatedAt: Date;
}

const ContentMetadataSchema: Schema = new Schema({
  wordCount: {
    type: Number,
    min: 0
  },
  readingTime: {
    type: Number,
    min: 0
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  version: {
    type: String,
    default: '1.0'
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }]
});

const FileMetadataSchema: Schema = new Schema({
  originalName: {
    type: String,
    required: [true, 'Original file name is required'],
    trim: true,
    maxlength: [255, 'File name cannot exceed 255 characters']
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required']
  },
  encoding: String,
  size: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size must be positive']
  },
  path: {
    type: String,
    required: [true, 'File path is required']
  },
  url: String, // Public URL for access
  thumbnailUrl: String, // Thumbnail for preview
  pages: {
    type: Number,
    min: 0
  },
  duration: {
    type: Number,
    min: 0
  },
  checksum: String, // For file integrity
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const MaterialEnhancedSchema: Schema = new Schema({
  title: {
    type: String,
    required: [true, 'Material title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters'],
    index: 'text'
  },
  description: {
    type: String,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
    index: 'text'
  },
  
  contentType: {
    type: String,
    enum: ['text', 'pdf', 'video', 'image', 'audio', 'url', 'mixed'],
    required: [true, 'Content type is required'],
    index: true
  },
  
  // Rich content storage
  textContent: {
    type: String,
    maxlength: [100000, 'Text content cannot exceed 100,000 characters']
  },
  htmlContent: {
    type: String,
    maxlength: [200000, 'HTML content cannot exceed 200,000 characters']
  },
  markdownContent: {
    type: String,
    maxlength: [100000, 'Markdown content cannot exceed 100,000 characters']
  },
  
  files: [FileMetadataSchema],
  primaryFile: String,
  
  externalUrl: {
    type: String,
    trim: true,
    validate: {
      validator: function(url: string) {
        if (!url) return true; // Optional field
        return /^https?:\/\/.+/.test(url);
      },
      message: 'External URL must be a valid HTTP/HTTPS URL'
    }
  },
  embedCode: {
    type: String,
    maxlength: [5000, 'Embed code cannot exceed 5000 characters']
  },
  
  // Enhanced categorization
  subject: {
    type: Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject is required'],
    index: true
  },
  classNumber: {
    type: Number,
    required: [true, 'Class number is required'],
    min: [5, 'Class must be between 5 and 12'],
    max: [12, 'Class must be between 5 and 12'],
    index: true
  },
  chapter: {
    type: String,
    maxlength: [100, 'Chapter name cannot exceed 100 characters'],
    index: true
  },
  topic: {
    type: String,
    maxlength: [100, 'Topic name cannot exceed 100 characters'],
    index: true
  },
  subtopic: {
    type: String,
    maxlength: [100, 'Subtopic name cannot exceed 100 characters']
  },
  
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner',
    index: true
  },
  prerequisites: [{
    type: String,
    maxlength: [100, 'Prerequisite cannot exceed 100 characters']
  }],
  learningObjectives: [{
    type: String,
    maxlength: [200, 'Learning objective cannot exceed 200 characters']
  }],
  
  metadata: {
    type: ContentMetadataSchema,
    default: () => ({})
  },
  
  // Access control
  isPublished: {
    type: Boolean,
    default: false,
    index: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  downloadable: {
    type: Boolean,
    default: true
  },
  viewable: {
    type: Boolean,
    default: true
  },
  requiresLogin: {
    type: Boolean,
    default: false
  },
  allowedRoles: [{
    type: String,
    enum: ['student', 'teacher', 'admin'],
    default: 'student'
  }],
  
  // Analytics
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  downloadCount: {
    type: Number,
    default: 0,
    min: 0
  },
  favoriteCount: {
    type: Number,
    default: 0,
    min: 0
  },
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  ratingCount: {
    type: Number,
    default: 0,
    min: 0
  },
  
  // Interactive features
  hasQuiz: {
    type: Boolean,
    default: false,
    index: true
  },
  hasDiscussion: {
    type: Boolean,
    default: false
  },
  allowComments: {
    type: Boolean,
    default: true
  },
  
  // Workflow
  status: {
    type: String,
    enum: ['draft', 'review', 'approved', 'published', 'archived'],
    default: 'draft',
    index: true
  },
  reviewedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: {
    type: String,
    maxlength: [1000, 'Review notes cannot exceed 1000 characters']
  },
  
  // Version control
  version: {
    type: String,
    default: '1.0'
  },
  parentVersion: {
    type: Schema.Types.ObjectId,
    ref: 'MaterialEnhanced'
  },
  isLatestVersion: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Scheduling
  publishAt: Date,
  unpublishAt: Date,
  
  // Ownership
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator is required']
  },
  lastModifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  collaborators: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  
  // SEO
  slug: {
    type: String,
    unique: true,
    sparse: true, // Allows null values to be non-unique
    maxlength: [100, 'Slug cannot exceed 100 characters']
  },
  keywords: [{
    type: String,
    trim: true,
    maxlength: [50, 'Keyword cannot exceed 50 characters']
  }],
  searchableContent: {
    type: String,
    index: 'text'
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
MaterialEnhancedSchema.index({ subject: 1, classNumber: 1, chapter: 1, status: 1 });
MaterialEnhancedSchema.index({ contentType: 1, difficulty: 1, isPublished: 1 });
MaterialEnhancedSchema.index({ createdBy: 1, status: 1, createdAt: -1 });
MaterialEnhancedSchema.index({ isActive: 1, isPublished: 1, publishAt: 1 });

// Text search index
MaterialEnhancedSchema.index({
  title: 'text',
  description: 'text',
  textContent: 'text',
  searchableContent: 'text',
  keywords: 'text'
});

// Pre-save middleware to update computed fields
MaterialEnhancedSchema.pre<IMaterialEnhanced>('save', function(next) {
  // Generate slug from title if not provided
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 100);
  }
  
  // Update searchable content
  const searchableText = [
    this.title,
    this.description,
    this.textContent,
    this.keywords?.join(' ')
  ].filter(Boolean).join(' ');
  
  this.searchableContent = searchableText.substring(0, 10000); // Limit size
  
  // Update metadata
  if (this.textContent) {
    this.metadata.wordCount = this.textContent.split(/\s+/).length;
    this.metadata.readingTime = Math.ceil(this.metadata.wordCount / 200); // 200 WPM average
  }
  
  this.metadata.lastModified = new Date();
  
  next();
});

// Static methods for advanced operations
MaterialEnhancedSchema.statics.findWithFilters = function(filters: any, options: any = {}) {
  const query = this.find(filters);
  
  if (options.populate) {
    query.populate(options.populate);
  }
  
  if (options.sort) {
    query.sort(options.sort);
  }
  
  if (options.limit) {
    query.limit(options.limit);
  }
  
  if (options.skip) {
    query.skip(options.skip);
  }
  
  return query;
};

MaterialEnhancedSchema.statics.getAnalytics = function(filters: any = {}) {
  return this.aggregate([
    { $match: { isActive: true, ...filters } },
    {
      $group: {
        _id: null,
        totalMaterials: { $sum: 1 },
        totalViews: { $sum: '$viewCount' },
        totalDownloads: { $sum: '$downloadCount' },
        avgRating: { $avg: '$averageRating' },
        contentTypeBreakdown: {
          $push: {
            contentType: '$contentType',
            count: 1
          }
        },
        difficultyBreakdown: {
          $push: {
            difficulty: '$difficulty',
            count: 1
          }
        }
      }
    }
  ]);
};

export default mongoose.models.MaterialEnhanced || mongoose.model<IMaterialEnhanced>('MaterialEnhanced', MaterialEnhancedSchema);