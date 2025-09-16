import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../backend/utils/database';
import MaterialEnhanced from '../../../../backend/models/MaterialEnhanced';
import { auth } from '../../../../lib/auth/middleware-mongo';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import * as pdf from 'pdf-parse';

// GET /api/materials/enhanced - Advanced filtering and content management
export async function GET(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const skip = (page - 1) * limit;
    
    // Build filters
    const filter: any = { isActive: true };
    
    // User role-based filtering
    if (user.role === 'student') {
      filter.isPublished = true;
      filter.allowedRoles = 'student';
    }
    
    // Basic filters
    if (searchParams.get('subject')) filter.subject = searchParams.get('subject');
    if (searchParams.get('classNumber')) filter.classNumber = parseInt(searchParams.get('classNumber')!);
    if (searchParams.get('chapter')) filter.chapter = new RegExp(searchParams.get('chapter')!, 'i');
    if (searchParams.get('topic')) filter.topic = new RegExp(searchParams.get('topic')!, 'i');
    if (searchParams.get('contentType')) filter.contentType = searchParams.get('contentType');
    if (searchParams.get('difficulty')) filter.difficulty = searchParams.get('difficulty');
    if (searchParams.get('status')) filter.status = searchParams.get('status');
    
    // Advanced filters
    if (searchParams.get('hasQuiz') === 'true') filter.hasQuiz = true;
    if (searchParams.get('downloadable') === 'true') filter.downloadable = true;
    if (searchParams.get('requiresLogin') === 'false') filter.requiresLogin = false;
    
    // Content filters
    const minViews = searchParams.get('minViews');
    const maxViews = searchParams.get('maxViews');
    if (minViews || maxViews) {
      filter.viewCount = {};
      if (minViews) filter.viewCount.$gte = parseInt(minViews);
      if (maxViews) filter.viewCount.$lte = parseInt(maxViews);
    }
    
    // Rating filter
    const minRating = searchParams.get('minRating');
    if (minRating) {
      filter.averageRating = { $gte: parseFloat(minRating) };
    }
    
    // Date filters
    const createdAfter = searchParams.get('createdAfter');
    const createdBefore = searchParams.get('createdBefore');
    if (createdAfter || createdBefore) {
      filter.createdAt = {};
      if (createdAfter) filter.createdAt.$gte = new Date(createdAfter);
      if (createdBefore) filter.createdAt.$lte = new Date(createdBefore);
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
    
    if (search) {
      sort.score = { $meta: 'textScore' };
    } else {
      sort[sortBy] = sortOrder;
    }
    
    // Execute queries
    const [materials, totalCount] = await Promise.all([
      MaterialEnhanced.find(filter)
        .populate('subject', 'name code')
        .populate('createdBy', 'name email')
        .populate('reviewedBy', 'name email')
        .populate('collaborators', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      MaterialEnhanced.countDocuments(filter)
    ]);
    
    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get analytics data
    const analytics = await MaterialEnhanced.getAnalytics(
      user.role === 'student' ? { isPublished: true } : {}
    );
    
    return NextResponse.json({
      success: true,
      materials,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        limit,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      analytics: analytics[0] || {},
      filters: Object.fromEntries(searchParams)
    });
    
  } catch (error: any) {
    console.error('Materials fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch materials', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/materials/enhanced - Create with rich content support
export async function POST(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || !['admin', 'teacher'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    
    const contentType = req.headers.get('content-type');
    
    if (contentType?.includes('multipart/form-data')) {
      return handleFileUpload(req, user);
    } else {
      return handleTextContent(req, user);
    }
    
  } catch (error: any) {
    console.error('Material creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create material', details: error.message },
      { status: 500 }
    );
  }
}

// Handle text-based content creation
async function handleTextContent(req: NextRequest, user: any) {
  const data = await req.json();
  
  const materialData = {
    ...data,
    createdBy: user.id,
    lastModifiedBy: user.id,
    contentType: data.contentType || 'text',
    status: data.status || 'draft',
    version: '1.0',
    isLatestVersion: true
  };
  
  const material = new MaterialEnhanced(materialData);
  await material.save();
  
  await material.populate(['subject', 'createdBy']);
  
  return NextResponse.json({
    success: true,
    material,
    message: 'Material created successfully'
  }, { status: 201 });
}

// Handle file upload with processing
async function handleFileUpload(req: NextRequest, user: any) {
  const formData = await req.formData();
  const files = formData.getAll('files') as File[];
  const materialData = JSON.parse(formData.get('materialData') as string);
  
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files provided' }, { status: 400 });
  }
  
  // Process each file
  const processedFiles = [];
  const uploadDir = join(process.cwd(), 'public', 'uploads', 'materials');
  
  // Ensure upload directory exists
  await mkdir(uploadDir, { recursive: true });
  
  for (const file of files) {
    const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const fileName = `${fileId}_${file.name}`;
    const filePath = join(uploadDir, fileName);
    const publicUrl = `/uploads/materials/${fileName}`;
    
    // Save file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);
    
    // Process file based on type
    const fileMetadata: any = {
      originalName: file.name,
      mimeType: file.type,
      size: file.size,
      path: filePath,
      url: publicUrl,
      uploadedAt: new Date()
    };
    
    // Extract text content for PDFs
    if (file.type === 'application/pdf') {
      try {
        const pdfData = await pdf(buffer);
        fileMetadata.pages = pdfData.numpages;
        
        // Store extracted text for search
        materialData.textContent = pdfData.text;
        materialData.contentType = 'pdf';
      } catch (error) {
        console.warn('PDF text extraction failed:', error);
      }
    }
    
    // Generate thumbnail for images
    if (file.type.startsWith('image/')) {
      // In production, use image processing library like Sharp
      fileMetadata.thumbnailUrl = publicUrl; // Placeholder
      materialData.contentType = materialData.contentType || 'image';
    }
    
    processedFiles.push(fileMetadata);
  }
  
  // Create material with file metadata
  const material = new MaterialEnhanced({
    ...materialData,
    files: processedFiles,
    primaryFile: processedFiles[0]?.originalName,
    createdBy: user.id,
    lastModifiedBy: user.id,
    status: materialData.status || 'draft',
    version: '1.0',
    isLatestVersion: true
  });
  
  await material.save();
  await material.populate(['subject', 'createdBy']);
  
  return NextResponse.json({
    success: true,
    material,
    message: 'Material created with files successfully'
  }, { status: 201 });
}

// PUT /api/materials/enhanced - Bulk operations and updates
export async function PUT(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || !['admin', 'teacher'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { operation, materialIds, updateData } = await req.json();
    
    switch (operation) {
      case 'bulk_publish':
        const publishResult = await MaterialEnhanced.updateMany(
          { 
            _id: { $in: materialIds },
            $or: [{ createdBy: user.id }, { collaborators: user.id }] // User can only modify their materials
          },
          { 
            $set: { 
              status: 'published',
              isPublished: true,
              publishAt: new Date(),
              lastModifiedBy: user.id
            }
          }
        );
        
        return NextResponse.json({
          success: true,
          message: `Published ${publishResult.modifiedCount} materials`,
          modifiedCount: publishResult.modifiedCount
        });
        
      case 'bulk_archive':
        const archiveResult = await MaterialEnhanced.updateMany(
          { 
            _id: { $in: materialIds },
            $or: [{ createdBy: user.id }, { collaborators: user.id }]
          },
          { 
            $set: { 
              status: 'archived',
              isActive: false,
              lastModifiedBy: user.id
            }
          }
        );
        
        return NextResponse.json({
          success: true,
          message: `Archived ${archiveResult.modifiedCount} materials`,
          modifiedCount: archiveResult.modifiedCount
        });
        
      case 'bulk_update':
        const updateResult = await MaterialEnhanced.updateMany(
          { 
            _id: { $in: materialIds },
            $or: [{ createdBy: user.id }, { collaborators: user.id }]
          },
          { 
            $set: { 
              ...updateData,
              lastModifiedBy: user.id
            }
          }
        );
        
        return NextResponse.json({
          success: true,
          message: `Updated ${updateResult.modifiedCount} materials`,
          modifiedCount: updateResult.modifiedCount
        });
        
      case 'increment_view':
        // Special operation for tracking views
        const viewResult = await MaterialEnhanced.findByIdAndUpdate(
          materialIds[0], // Single ID for view increment
          { $inc: { viewCount: 1 } },
          { new: true }
        );
        
        return NextResponse.json({
          success: true,
          material: viewResult
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

// DELETE /api/materials/enhanced - Soft delete materials
export async function DELETE(req: NextRequest) {
  try {
    const user = await auth(req);
    if (!user || !['admin', 'teacher'].includes(user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const materialId = searchParams.get('id');
    
    if (!materialId) {
      return NextResponse.json({ error: 'Material ID is required' }, { status: 400 });
    }
    
    // Soft delete (mark as inactive)
    const material = await MaterialEnhanced.findOneAndUpdate(
      { 
        _id: materialId,
        $or: [{ createdBy: user.id }, { collaborators: user.id }]
      },
      { 
        $set: { 
          isActive: false,
          status: 'archived',
          lastModifiedBy: user.id
        }
      },
      { new: true }
    );
    
    if (!material) {
      return NextResponse.json({ error: 'Material not found or access denied' }, { status: 404 });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully'
    });
    
  } catch (error: any) {
    console.error('Material deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete material', details: error.message },
      { status: 500 }
    );
  }
}