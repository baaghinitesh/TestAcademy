/**
 * Data Migration Script: Questions V1 to Enhanced V2
 * 
 * This script migrates existing questions from the original schema to the enhanced V2 schema
 * with proper hierarchical structure and new fields.
 * 
 * Features:
 * - Migrates all existing questions to EnhancedV2 schema
 * - Adds missing hierarchical fields (chapter, topic, etc.)
 * - Backfills new fields with sensible defaults
 * - Creates compound indexes for performance
 * - Provides detailed migration report
 * - Rollback capability
 * 
 * Usage:
 * npm run migrate:questions-v2 [--dry-run] [--rollback]
 */

import mongoose from 'mongoose';
import { QuestionEnhanced } from '../backend/models/QuestionEnhanced';
import { QuestionEnhancedV2 } from '../backend/models/QuestionEnhancedV2';

interface MigrationReport {
  totalQuestions: number;
  migratedQuestions: number;
  skippedQuestions: number;
  errors: Array<{
    questionId: string;
    error: string;
  }>;
  duplicatesFound: number;
  indexesCreated: string[];
  duration: number;
}

// Subject-Chapter-Topic mapping for missing hierarchy
const HIERARCHY_MAPPING = {
  'Mathematics': {
    6: {
      'Whole Numbers': ['Place Value', 'Operations', 'Word Problems'],
      'Basic Geometrical Ideas': ['Points and Lines', 'Shapes', 'Angles'],
      'Integers': ['Introduction', 'Operations', 'Properties'],
      'Fractions': ['Types', 'Operations', 'Decimal Fractions'],
      'Decimals': ['Introduction', 'Operations', 'Applications'],
      'Data Handling': ['Collection', 'Organization', 'Representation'],
      'Mensuration': ['Perimeter', 'Area', 'Volume'],
      'Algebra': ['Introduction to Algebra', 'Simple Equations'],
      'Ratio and Proportion': ['Ratios', 'Proportions', 'Unitary Method'],
      'Symmetry': ['Lines of Symmetry', 'Rotational Symmetry']
    },
    7: {
      'Integers': ['Properties', 'Operations', 'Applications'],
      'Fractions and Decimals': ['Operations', 'Applications'],
      'Data Handling': ['Collection', 'Organization', 'Bar Graphs'],
      'Simple Equations': ['Setting up Equations', 'Solving Equations'],
      'Lines and Angles': ['Basic Concepts', 'Types of Lines', 'Angles'],
      'The Triangle and its Properties': ['Medians', 'Altitudes', 'Exterior Angle'],
      'Congruence of Triangles': ['Criteria', 'Applications'],
      'Comparing Quantities': ['Ratios', 'Percentages', 'Profit and Loss'],
      'Rational Numbers': ['Introduction', 'Operations', 'Properties'],
      'Practical Geometry': ['Construction of Lines', 'Construction of Triangles'],
      'Perimeter and Area': ['Rectangles', 'Squares', 'Parallelograms'],
      'Algebraic Expressions': ['Terms', 'Like and Unlike Terms', 'Operations'],
      'Exponents and Powers': ['Laws', 'Applications'],
      'Symmetry': ['Line Symmetry', 'Rotational Symmetry']
    },
    8: {
      'Rational Numbers': ['Properties', 'Operations', 'Representation'],
      'Linear Equations in One Variable': ['Solving Equations', 'Applications'],
      'Understanding Quadrilaterals': ['Properties', 'Types', 'Area'],
      'Practical Geometry': ['Construction of Quadrilaterals'],
      'Data Handling': ['Bar Graphs', 'Histograms', 'Pie Charts'],
      'Squares and Square Roots': ['Properties', 'Finding Square Roots'],
      'Cubes and Cube Roots': ['Properties', 'Finding Cube Roots'],
      'Comparing Quantities': ['Ratios and Proportions', 'Percentages'],
      'Algebraic Expressions and Identities': ['Operations', 'Identities'],
      'Mensuration': ['Area', 'Volume', 'Surface Area'],
      'Exponents and Powers': ['Laws', 'Standard Form'],
      'Direct and Inverse Proportions': ['Direct Proportion', 'Inverse Proportion'],
      'Factorisation': ['Methods', 'Applications'],
      'Introduction to Graphs': ['Linear Graphs', 'Applications']
    },
    9: {
      'Number Systems': ['Real Numbers', 'Irrational Numbers', 'Operations'],
      'Polynomials': ['Definition', 'Operations', 'Factorization'],
      'Coordinate Geometry': ['Cartesian Plane', 'Plotting Points'],
      'Linear Equations in Two Variables': ['Solutions', 'Graphical Method'],
      'Introduction to Euclids Geometry': ['Axioms', 'Postulates'],
      'Lines and Angles': ['Parallel Lines', 'Transversals'],
      'Triangles': ['Congruence', 'Properties'],
      'Quadrilaterals': ['Properties', 'Types'],
      'Areas of Parallelograms and Triangles': ['Theorems', 'Applications'],
      'Circles': ['Properties', 'Theorems'],
      'Constructions': ['Triangles', 'Angles'],
      'Herons Formula': ['Area of Triangles', 'Applications'],
      'Surface Areas and Volumes': ['Cuboids', 'Cylinders', 'Cones', 'Spheres'],
      'Statistics': ['Collection', 'Organization', 'Presentation'],
      'Probability': ['Basic Concepts', 'Experimental Probability']
    },
    10: {
      'Real Numbers': ['Euclids Division Lemma', 'Fundamental Theorem'],
      'Polynomials': ['Zeros', 'Relationship between Zeros and Coefficients'],
      'Pair of Linear Equations in Two Variables': ['Graphical Method', 'Algebraic Methods'],
      'Quadratic Equations': ['Standard Form', 'Methods of Solution'],
      'Arithmetic Progressions': ['General Term', 'Sum of Terms'],
      'Triangles': ['Similarity', 'Criteria for Similarity'],
      'Coordinate Geometry': ['Distance Formula', 'Section Formula'],
      'Introduction to Trigonometry': ['Ratios', 'Values', 'Applications'],
      'Some Applications of Trigonometry': ['Heights and Distances'],
      'Circles': ['Tangents', 'Properties'],
      'Constructions': ['Division of Line Segment', 'Tangents to Circle'],
      'Areas Related to Circles': ['Perimeter', 'Area of Sectors'],
      'Surface Areas and Volumes': ['Combinations of Solids'],
      'Statistics': ['Mean', 'Median', 'Mode', 'Cumulative Frequency'],
      'Probability': ['Classical Definition', 'Basic Problems']
    }
  },
  'Physics': {
    6: {
      'Fun with Magnets': ['Properties', 'Uses', 'Making Magnets'],
      'Light Shadows and Reflections': ['Sources', 'Shadows', 'Images'],
      'Electricity and Circuits': ['Electric Cell', 'Bulb', 'Circuits'],
      'Motion and Measurement of Distances': ['Types of Motion', 'Measurement']
    },
    7: {
      'Heat': ['Hot and Cold', 'Temperature', 'Transfer of Heat'],
      'Acids Bases and Salts': ['Indicators', 'Properties'],
      'Physical and Chemical Changes': ['Types', 'Examples'],
      'Weather Climate and Adaptations': ['Elements', 'Adaptation']
    },
    8: {
      'Force and Pressure': ['Effects of Force', 'Pressure'],
      'Friction': ['Types', 'Factors', 'Applications'],
      'Sound': ['Production', 'Propagation', 'Characteristics'],
      'Chemical Effects of Electric Current': ['Conduction', 'Electroplating'],
      'Some Natural Phenomena': ['Lightning', 'Earthquakes'],
      'Light': ['Reflection', 'Multiple Images', 'Dispersion']
    }
  },
  'Chemistry': {
    8: {
      'Materials Metals and Non Metals': ['Properties', 'Uses'],
      'Coal and Petroleum': ['Formation', 'Processing', 'Products'],
      'Combustion and Flame': ['Types', 'Conditions', 'Fire Safety'],
      'Synthetic Fibres and Plastics': ['Types', 'Properties', 'Uses']
    }
  },
  'Biology': {
    6: {
      'Food Where Does it Come From': ['Sources', 'Types', 'Components'],
      'Components of Food': ['Nutrients', 'Balanced Diet', 'Deficiency'],
      'Fibre to Fabric': ['Plant Fibres', 'Animal Fibres'],
      'Sorting Materials into Groups': ['Properties', 'Classification'],
      'Separation of Substances': ['Methods', 'Applications'],
      'Changes Around Us': ['Types', 'Reversible and Irreversible'],
      'Getting to Know Plants': ['Parts', 'Functions', 'Types'],
      'Body Movements': ['Joints', 'Muscles', 'Movement in Animals'],
      'The Living Organisms and Their Surroundings': ['Habitat', 'Adaptation'],
      'Garbage In Garbage Out': ['Types', 'Management', 'Recycling']
    },
    7: {
      'Nutrition in Plants': ['Photosynthesis', 'Nutrients', 'Modes'],
      'Nutrition in Animals': ['Components', 'Process', 'Digestive System'],
      'Respiration in Organisms': ['Types', 'Process', 'Organs'],
      'Transportation in Animals and Plants': ['Circulatory System', 'Transport in Plants'],
      'Reproduction in Plants': ['Types', 'Sexual Reproduction', 'Asexual Reproduction'],
      'Motion and Time': ['Types of Motion', 'Measurement of Time'],
      'Electric Current and Its Effects': ['Symbols', 'Heating Effect', 'Magnetic Effect'],
      'Winds Storms and Cyclones': ['Air Pressure', 'Wind Currents', 'Cyclones'],
      'Soil': ['Formation', 'Types', 'Conservation'],
      'Forests Our Lifeline': ['Types', 'Importance', 'Conservation'],
      'Wastewater Story': ['Treatment', 'Management']
    }
  }
};

// Default bloom's taxonomy mapping based on question patterns
const getBloomsTaxonomy = (question: string): string => {
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('define') || lowerQuestion.includes('what is') || lowerQuestion.includes('list')) {
    return 'remember';
  } else if (lowerQuestion.includes('explain') || lowerQuestion.includes('describe') || lowerQuestion.includes('why')) {
    return 'understand';
  } else if (lowerQuestion.includes('calculate') || lowerQuestion.includes('solve') || lowerQuestion.includes('apply')) {
    return 'apply';
  } else if (lowerQuestion.includes('analyze') || lowerQuestion.includes('compare') || lowerQuestion.includes('examine')) {
    return 'analyze';
  } else if (lowerQuestion.includes('evaluate') || lowerQuestion.includes('assess') || lowerQuestion.includes('judge')) {
    return 'evaluate';
  } else if (lowerQuestion.includes('create') || lowerQuestion.includes('design') || lowerQuestion.includes('develop')) {
    return 'create';
  }
  
  return 'understand'; // Default
};

// Extract chapter and topic from existing question data
const extractHierarchy = (question: any) => {
  const subject = question.subject?.name || question.subject;
  const classNumber = question.classNumber;
  
  // Try to extract from existing chapter/topic fields
  let chapter = question.chapter || '';
  let topic = question.topic || '';
  
  // If not available, try to infer from tags or question content
  if (!chapter && question.tags && question.tags.length > 0) {
    const firstTag = question.tags[0];
    chapter = firstTag;
  }
  
  // Use hierarchy mapping to fill missing data
  if (!chapter || !topic) {
    const subjectMapping = HIERARCHY_MAPPING[subject]?.[classNumber];
    if (subjectMapping) {
      const chapters = Object.keys(subjectMapping);
      
      if (!chapter && chapters.length > 0) {
        // Try to match chapter from question content or use first available
        const questionText = question.question.toLowerCase();
        chapter = chapters.find(ch => questionText.includes(ch.toLowerCase())) || chapters[0];
      }
      
      if (!topic && chapter && subjectMapping[chapter]) {
        // Try to match topic from question content or use first available
        const questionText = question.question.toLowerCase();
        const topics = subjectMapping[chapter];
        topic = topics.find(tp => questionText.includes(tp.toLowerCase())) || topics[0];
      }
    }
  }
  
  // Final fallback
  if (!chapter) chapter = 'General';
  if (!topic) topic = 'Basic Concepts';
  
  return { chapter, topic };
};

class QuestionMigrationV2 {
  private report: MigrationReport = {
    totalQuestions: 0,
    migratedQuestions: 0,
    skippedQuestions: 0,
    errors: [],
    duplicatesFound: 0,
    indexesCreated: [],
    duration: 0
  };

  private isDryRun: boolean = false;
  private isRollback: boolean = false;

  constructor(options: { dryRun?: boolean; rollback?: boolean } = {}) {
    this.isDryRun = options.dryRun || false;
    this.isRollback = options.rollback || false;
  }

  async connect() {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is required');
    }
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  }

  async disconnect() {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }

  async createIndexes() {
    if (this.isDryRun) {
      console.log('🔍 [DRY RUN] Would create compound indexes for enhanced performance');
      return;
    }

    try {
      // Create compound indexes for hierarchical queries
      const indexes = [
        { classNumber: 1, subject: 1, chapter: 1, topic: 1 },
        { subject: 1, difficulty: 1, isActive: 1 },
        { verificationStatus: 1, isActive: 1 },
        { createdAt: -1 },
        { usageCount: -1 },
        { correctAnswerRate: -1 },
        { tags: 1 },
        { bloomsTaxonomy: 1, difficulty: 1 }
      ];

      for (const index of indexes) {
        await QuestionEnhancedV2.collection.createIndex(index);
        this.report.indexesCreated.push(JSON.stringify(index));
      }

      console.log(`✅ Created ${indexes.length} compound indexes`);
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
      throw error;
    }
  }

  async rollbackMigration() {
    console.log('🔄 Starting rollback migration...');
    
    if (this.isDryRun) {
      const count = await QuestionEnhancedV2.countDocuments();
      console.log(`🔍 [DRY RUN] Would delete ${count} migrated questions from V2 collection`);
      return;
    }

    const result = await QuestionEnhancedV2.deleteMany({});
    console.log(`✅ Rollback complete: Deleted ${result.deletedCount} questions from V2 collection`);
  }

  async migrateQuestions() {
    const startTime = Date.now();
    
    try {
      if (this.isRollback) {
        await this.rollbackMigration();
        return;
      }

      console.log('🚀 Starting Questions V1 to V2 Migration...');
      
      // Get total count
      this.report.totalQuestions = await QuestionEnhanced.countDocuments();
      console.log(`📊 Total questions to migrate: ${this.report.totalQuestions}`);

      if (this.isDryRun) {
        console.log('🔍 DRY RUN MODE - No actual changes will be made');
      }

      // Process in batches for better performance
      const batchSize = 100;
      let processed = 0;

      while (processed < this.report.totalQuestions) {
        const questions = await QuestionEnhanced.find({})
          .skip(processed)
          .limit(batchSize)
          .lean();

        for (const question of questions) {
          try {
            await this.migrateQuestion(question);
            this.report.migratedQuestions++;
          } catch (error) {
            console.error(`❌ Error migrating question ${question._id}:`, error);
            this.report.errors.push({
              questionId: question._id.toString(),
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        }

        processed += questions.length;
        
        // Show progress
        const progress = Math.round((processed / this.report.totalQuestions) * 100);
        console.log(`📈 Progress: ${processed}/${this.report.totalQuestions} (${progress}%)`);
      }

      // Create indexes
      await this.createIndexes();

      this.report.duration = Date.now() - startTime;
      
      console.log('✅ Migration completed successfully!');
      this.printReport();

    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }

  private async migrateQuestion(oldQuestion: any) {
    // Check if already migrated (avoid duplicates)
    const existingV2 = await QuestionEnhancedV2.findOne({ 
      question: oldQuestion.question,
      subject: oldQuestion.subject?.name || oldQuestion.subject,
      classNumber: oldQuestion.classNumber 
    });

    if (existingV2) {
      this.report.duplicatesFound++;
      this.report.skippedQuestions++;
      return;
    }

    if (this.isDryRun) {
      console.log(`🔍 [DRY RUN] Would migrate: "${oldQuestion.question.substring(0, 50)}..."`);
      return;
    }

    // Extract hierarchy
    const { chapter, topic } = extractHierarchy(oldQuestion);
    
    // Create enhanced V2 question
    const enhancedQuestion = {
      question: oldQuestion.question,
      questionType: oldQuestion.questionType || 'single-choice',
      subject: oldQuestion.subject?.name || oldQuestion.subject,
      classNumber: oldQuestion.classNumber,
      chapter,
      topic,
      subtopic: oldQuestion.subtopic || undefined,
      difficulty: oldQuestion.difficulty || 'medium',
      marks: oldQuestion.marks || 1,
      options: oldQuestion.options || [],
      explanation: oldQuestion.explanation || undefined,
      questionImageUrl: oldQuestion.questionImageUrl || undefined,
      explanationImageUrl: oldQuestion.explanationImageUrl || undefined,
      tags: oldQuestion.tags || [],
      
      // New enhanced fields
      bloomsTaxonomy: getBloomsTaxonomy(oldQuestion.question),
      estimatedTime: this.getEstimatedTime(oldQuestion.difficulty, oldQuestion.questionType),
      prerequisites: oldQuestion.prerequisites || [],
      learningOutcomes: oldQuestion.learningOutcomes || [],
      
      // Status fields
      isActive: oldQuestion.isActive !== false, // Default to true if not set
      isVerified: oldQuestion.isVerified || false,
      verificationStatus: oldQuestion.verificationStatus || 'pending',
      verificationNotes: oldQuestion.verificationNotes || undefined,
      
      // Analytics fields (start with defaults)
      usageCount: oldQuestion.usageCount || 0,
      correctAnswerRate: oldQuestion.correctAnswerRate || null,
      avgTimeSpent: oldQuestion.avgTimeSpent || null,
      
      // Metadata
      createdBy: oldQuestion.createdBy || 'migration-script',
      createdAt: oldQuestion.createdAt || new Date(),
      updatedAt: new Date(),
      
      // Migration metadata
      migratedFrom: oldQuestion._id,
      migrationDate: new Date()
    };

    await QuestionEnhancedV2.create(enhancedQuestion);
  }

  private getEstimatedTime(difficulty: string, questionType: string): number {
    const baseTimes = {
      'single-choice': 60,
      'multiple-choice': 90,
      'true-false': 30,
      'numerical': 120,
      'fill-in-blank': 45
    };
    
    const difficultyMultipliers = {
      'easy': 0.8,
      'medium': 1.0,
      'hard': 1.5
    };
    
    const baseTime = baseTimes[questionType as keyof typeof baseTimes] || 60;
    const multiplier = difficultyMultipliers[difficulty as keyof typeof difficultyMultipliers] || 1.0;
    
    return Math.round(baseTime * multiplier);
  }

  private printReport() {
    console.log('\n📋 MIGRATION REPORT');
    console.log('='.repeat(50));
    console.log(`📊 Total Questions: ${this.report.totalQuestions}`);
    console.log(`✅ Successfully Migrated: ${this.report.migratedQuestions}`);
    console.log(`⏭️ Skipped (Duplicates): ${this.report.duplicatesFound}`);
    console.log(`❌ Errors: ${this.report.errors.length}`);
    console.log(`🏗️ Indexes Created: ${this.report.indexesCreated.length}`);
    console.log(`⏱️ Duration: ${Math.round(this.report.duration / 1000)}s`);
    
    if (this.report.errors.length > 0) {
      console.log('\n❌ ERRORS:');
      this.report.errors.forEach(error => {
        console.log(`  - ${error.questionId}: ${error.error}`);
      });
    }
    
    console.log('\n✅ Migration completed successfully!');
    console.log('📈 Performance indexes have been created for optimal query performance.');
    console.log('🔄 The original V1 questions remain untouched for safety.');
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const isDryRun = args.includes('--dry-run');
  const isRollback = args.includes('--rollback');
  
  console.log('🔧 Questions V1 to V2 Migration Script');
  console.log('=====================================');
  
  if (isDryRun) {
    console.log('🔍 Running in DRY RUN mode - no changes will be made');
  }
  
  if (isRollback) {
    console.log('🔄 Running in ROLLBACK mode - will delete V2 questions');
  }

  const migration = new QuestionMigrationV2({ dryRun: isDryRun, rollback: isRollback });
  
  try {
    await migration.connect();
    await migration.migrateQuestions();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await migration.disconnect();
  }
}

// Only run if called directly
if (require.main === module) {
  main().catch(console.error);
}

export { QuestionMigrationV2 };