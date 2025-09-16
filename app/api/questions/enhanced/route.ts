import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../backend/utils/database';
import QuestionEnhanced from '../../../../backend/models/QuestionEnhanced';
import { auth } from '../../../../lib/auth/middleware-mongo';

// GET /api/questions/enhanced - Advanced filtering and pagination for high-volume
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100); // Max 100 items
    const skip = (page - 1) * limit;
    
    // Build filter query
    const filter: any = {};
    
    // Basic filters
    if (searchParams.get('subject')) filter.subject = searchParams.get('subject');
    if (searchParams.get('classNumber')) filter.classNumber = parseInt(searchParams.get('classNumber')!);
    if (searchParams.get('chapter')) filter.chapter = new RegExp(searchParams.get('chapter')!, 'i');
    if (searchParams.get('topic')) filter.topic = new RegExp(searchParams.get('topic')!, 'i');
    if (searchParams.get('difficulty')) filter.difficulty = searchParams.get('difficulty');
    if (searchParams.get('questionType')) filter.questionType = searchParams.get('questionType');
    
    // Enhanced filters
    if (searchParams.get('hasImage') === 'true') filter.hasImage = true;
    if (searchParams.get('hasExplanation') === 'true') filter.hasExplanation = true;
    if (searchParams.get('hasHint') === 'true') filter.hasHint = true;
    if (searchParams.get('isVerified') === 'true') filter.isVerified = true;
    if (searchParams.get('isActive') === 'false') filter.isActive = false;
    else filter.isActive = true; // Default to active questions
    
    // Date range filters
    const createdAfter = searchParams.get('createdAfter');
    const createdBefore = searchParams.get('createdBefore');
    if (createdAfter || createdBefore) {
      filter.createdAt = {};
      if (createdAfter) filter.createdAt.$gte = new Date(createdAfter);
      if (createdBefore) filter.createdAt.$lte = new Date(createdBefore);
    }
    
    // Usage analytics filters
    const minUsage = searchParams.get('minUsageCount');
    const maxUsage = searchParams.get('maxUsageCount');
    if (minUsage || maxUsage) {
      filter.usageCount = {};
      if (minUsage) filter.usageCount.$gte = parseInt(minUsage);
      if (maxUsage) filter.usageCount.$lte = parseInt(maxUsage);
    }
    
    // Correct answer rate filter
    const minCorrectRate = searchParams.get('minCorrectRate');
    const maxCorrectRate = searchParams.get('maxCorrectRate');
    if (minCorrectRate || maxCorrectRate) {
      filter.correctAnswerRate = {};
      if (minCorrectRate) filter.correctAnswerRate.$gte = parseFloat(minCorrectRate);
      if (maxCorrectRate) filter.correctAnswerRate.$lte = parseFloat(maxCorrectRate);
    }
    
    // Batch filter
    if (searchParams.get('batchId')) filter.batchId = searchParams.get('batchId');
    
    // Tags filter
    const tags = searchParams.get('tags');
    if (tags) {
      const tagList = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagList };
    }
    
    // Text search
    const search = searchParams.get('search');
    if (search) {
      filter.$text = { $search: search };
    }
    
    // Sorting
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? 1 : -1;
    const sort: any = {};
    
    // Special sorting for text search (by score)
    if (search) {
      sort.score = { $meta: 'textScore' };
    } else {
      sort[sortBy] = sortOrder;
    }
    
    // Execute queries
    const [questions, totalCount] = await Promise.all([
      QuestionEnhanced.find(filter)
        .populate('subject', 'name code')
        .populate('createdBy', 'name email')
        .populate('verifiedBy', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(), // Use lean for better performance
      QuestionEnhanced.countDocuments(filter)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;
    
    // Get aggregated statistics
    const stats = await QuestionEnhanced.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalQuestions: { $sum: 1 },
          avgCorrectRate: { $avg: '$correctAnswerRate' },
          totalUsage: { $sum: '$usageCount' },
          verifiedCount: { $sum: { $cond: ['$isVerified', 1, 0] } },
          withImageCount: { $sum: { $cond: ['$hasImage', 1, 0] } },
          withExplanationCount: { $sum: { $cond: ['$hasExplanation', 1, 0] } }
        }
      }
    ]);
    
    return NextResponse.json({
      success: true,
      questions,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext,
        hasPrev
      },
      statistics: stats[0] || {
        totalQuestions: 0,
        avgCorrectRate: 0,
        totalUsage: 0,
        verifiedCount: 0,
        withImageCount: 0,
        withExplanationCount: 0
      },
      filters: Object.fromEntries(searchParams)
    });
    
  } catch (error: any) {
    console.error('Questions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch questions', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/questions/enhanced - Create with enhanced features
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const data = await req.json();
    
    // Generate batch ID if not provided
    const batchId = data.batchId || `batch_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    
    const questionData = {
      ...data,
      createdBy: user.id,
      batchId,
      importSource: 'manual'
    };
    
    const question = new QuestionEnhanced(questionData);
    await question.save();
    
    // Populate references for response
    await question.populate(['subject', 'createdBy']);
    
    return NextResponse.json({
      success: true,
      question,
      message: 'Question created successfully'
    }, { status: 201 });
    
  } catch (error: any) {
    console.error('Question creation error:', error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map((err: any) => err.message);
      return NextResponse.json(
        { error: 'Validation failed', details: validationErrors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create question', details: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/questions/enhanced - Bulk operations
export async function PUT(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { operation, questionIds, updateData } = await req.json();
    
    switch (operation) {
      case 'bulk_update':
        const updateResult = await QuestionEnhanced.updateMany(
          { _id: { $in: questionIds } },
          { $set: updateData }
        );
        
        return NextResponse.json({
          success: true,
          message: `Updated ${updateResult.modifiedCount} questions`,
          modifiedCount: updateResult.modifiedCount
        });
        
      case 'bulk_verify':
        const verifyResult = await QuestionEnhanced.updateMany(
          { _id: { $in: questionIds } },
          { 
            $set: { 
              isVerified: true, 
              verifiedBy: user.id,
              verifiedAt: new Date()
            }
          }
        );
        
        return NextResponse.json({
          success: true,
          message: `Verified ${verifyResult.modifiedCount} questions`,
          modifiedCount: verifyResult.modifiedCount
        });
        
      case 'bulk_deactivate':
        const deactivateResult = await QuestionEnhanced.updateMany(
          { _id: { $in: questionIds } },
          { $set: { isActive: false } }
        );
        
        return NextResponse.json({
          success: true,
          message: `Deactivated ${deactivateResult.modifiedCount} questions`,
          modifiedCount: deactivateResult.modifiedCount
        });
        
      case 'bulk_delete':
        const deleteResult = await QuestionEnhanced.deleteMany({
          _id: { $in: questionIds }
        });
        
        return NextResponse.json({
          success: true,
          message: `Deleted ${deleteResult.deletedCount} questions`,
          deletedCount: deleteResult.deletedCount
        });
        
      default:
        return NextResponse.json(
          { error: 'Invalid operation' },
          { status: 400 }
        );
    }
    
  } catch (error: any) {
    console.error('Bulk operation error:', error);
    return NextResponse.json(
      { error: 'Failed to perform bulk operation', details: error.message },
      { status: 500 }
    );
  }
}