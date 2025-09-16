import { NextRequest, NextResponse } from 'next/server';
import connectToDatabase from '../../../../backend/utils/database';
import { Attempt, User, Test, Question } from '../../../../backend/models';
import { requireAdmin } from '../../../../backend/middleware/auth';

// GET /api/analytics/export - Export analytics data as CSV or PDF
async function exportAnalyticsHandler(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const format = searchParams.get('format') || 'csv';
    const dateRange = searchParams.get('dateRange') || '30days';
    const subjectFilter = searchParams.get('subject') || 'all';
    const classFilter = searchParams.get('class') || 'all';

    await connectToDatabase();

    // Calculate date range
    const now = new Date();
    const startDate = new Date();
    
    switch (dateRange) {
      case '7days':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch comprehensive analytics data
    const attempts = await Attempt.find({
      createdAt: { $gte: startDate },
      status: 'completed'
    })
    .populate([
      { path: 'student', select: 'name email' },
      { path: 'test', select: 'title description totalMarks totalQuestions' }
    ])
    .sort({ createdAt: -1 });

    if (format === 'csv') {
      return generateCSVReport(attempts, dateRange);
    } else if (format === 'pdf') {
      return generatePDFReport(attempts, dateRange);
    } else {
      return NextResponse.json(
        { error: 'Invalid format. Supported formats: csv, pdf' },
        { status: 400 }
      );
    }

  } catch (error: any) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    );
  }
}

function generateCSVReport(attempts: any[], dateRange: string) {
  // CSV Headers
  const csvHeaders = [
    'Student Name',
    'Student Email',
    'Test Title', 
    'Score (%)',
    'Marks Earned',
    'Total Marks',
    'Correct Answers',
    'Total Questions',
    'Time Taken (minutes)',
    'Completion Date',
    'Performance Grade'
  ];

  // Generate CSV rows
  const csvRows = attempts.map(attempt => {
    const timeTakenMinutes = Math.round(attempt.totalTimeTaken / 60);
    const performanceGrade = getPerformanceGrade(attempt.percentage);
    
    return [
      `"${attempt.student.name}"`,
      `"${attempt.student.email}"`,
      `"${attempt.test.title}"`,
      attempt.percentage.toFixed(1),
      attempt.totalMarksEarned,
      attempt.test.totalMarks,
      attempt.answers.filter((a: any) => a.isCorrect).length,
      attempt.test.totalQuestions,
      timeTakenMinutes,
      attempt.completedAt.toISOString().split('T')[0],
      performanceGrade
    ];
  });

  // Combine headers and rows
  const csvContent = [
    csvHeaders.join(','),
    ...csvRows.map(row => row.join(','))
  ].join('\n');

  // Create response with CSV content
  const response = new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="analytics-report-${dateRange}-${Date.now()}.csv"`
    }
  });

  return response;
}

function generatePDFReport(attempts: any[], dateRange: string) {
  // Generate basic HTML report (in a real app, you'd use a PDF library like puppeteer or jsPDF)
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Analytics Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { background: #f5f5f5; padding: 20px; margin-bottom: 20px; border-radius: 5px; }
        .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-box { background: white; padding: 15px; border-radius: 5px; text-align: center; border: 1px solid #ddd; }
        .stat-value { font-size: 2em; font-weight: bold; color: #2563eb; }
        .stat-label { color: #666; margin-top: 5px; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; font-weight: bold; }
        .grade-excellent { color: #059669; font-weight: bold; }
        .grade-good { color: #2563eb; font-weight: bold; }
        .grade-average { color: #d97706; font-weight: bold; }
        .grade-poor { color: #dc2626; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Learning Management System</h1>
        <h2>Analytics Report</h2>
        <p>Period: ${formatDateRange(dateRange)} | Generated: ${new Date().toLocaleDateString()}</p>
      </div>

      <div class="summary">
        <h3>Executive Summary</h3>
        ${generateSummaryStats(attempts)}
      </div>

      <div class="stats">
        ${generateStatBoxes(attempts)}
      </div>

      <h3>Detailed Performance Report</h3>
      <table>
        <thead>
          <tr>
            <th>Student</th>
            <th>Test</th>
            <th>Score</th>
            <th>Marks</th>
            <th>Time</th>
            <th>Grade</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          ${attempts.map(attempt => `
            <tr>
              <td>${attempt.student.name}</td>
              <td>${attempt.test.title}</td>
              <td>${attempt.percentage.toFixed(1)}%</td>
              <td>${attempt.totalMarksEarned}/${attempt.test.totalMarks}</td>
              <td>${Math.round(attempt.totalTimeTaken / 60)}m</td>
              <td class="grade-${getGradeClass(attempt.percentage)}">${getPerformanceGrade(attempt.percentage)}</td>
              <td>${attempt.completedAt.toLocaleDateString()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ddd; text-align: center; color: #666;">
        <p>Report generated by LMS Analytics Engine</p>
        <p>For questions about this report, contact your system administrator.</p>
      </div>
    </body>
    </html>
  `;

  const response = new NextResponse(htmlContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `attachment; filename="analytics-report-${dateRange}-${Date.now()}.html"`
    }
  });

  return response;
}

function getPerformanceGrade(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 85) return 'A';
  if (percentage >= 80) return 'A-';
  if (percentage >= 75) return 'B+';
  if (percentage >= 70) return 'B';
  if (percentage >= 65) return 'B-';
  if (percentage >= 60) return 'C+';
  if (percentage >= 55) return 'C';
  if (percentage >= 50) return 'C-';
  if (percentage >= 45) return 'D';
  return 'F';
}

function getGradeClass(percentage: number): string {
  if (percentage >= 80) return 'excellent';
  if (percentage >= 70) return 'good';
  if (percentage >= 50) return 'average';
  return 'poor';
}

function formatDateRange(dateRange: string): string {
  const ranges: { [key: string]: string } = {
    '7days': 'Last 7 Days',
    '30days': 'Last 30 Days', 
    '90days': 'Last 90 Days',
    '1year': 'Last Year'
  };
  return ranges[dateRange] || 'Last 30 Days';
}

function generateSummaryStats(attempts: any[]): string {
  const totalAttempts = attempts.length;
  const averageScore = totalAttempts > 0 
    ? attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts 
    : 0;
  const excellentPerformers = attempts.filter(a => a.percentage >= 90).length;
  const needImprovement = attempts.filter(a => a.percentage < 60).length;

  return `
    <p>This report analyzes ${totalAttempts} test attempts with an average score of ${averageScore.toFixed(1)}%.</p>
    <p>${excellentPerformers} students (${((excellentPerformers/totalAttempts)*100).toFixed(1)}%) achieved excellent performance (90%+).</p>
    <p>${needImprovement} students (${((needImprovement/totalAttempts)*100).toFixed(1)}%) may need additional support (below 60%).</p>
  `;
}

function generateStatBoxes(attempts: any[]): string {
  const totalAttempts = attempts.length;
  const averageScore = totalAttempts > 0 
    ? attempts.reduce((sum, a) => sum + a.percentage, 0) / totalAttempts 
    : 0;
  const totalTimeTaken = attempts.reduce((sum, a) => sum + a.totalTimeTaken, 0);
  const averageTime = totalAttempts > 0 ? totalTimeTaken / totalAttempts / 60 : 0;
  const uniqueStudents = new Set(attempts.map(a => a.student._id)).size;

  return `
    <div class="stat-box">
      <div class="stat-value">${totalAttempts}</div>
      <div class="stat-label">Total Attempts</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${averageScore.toFixed(1)}%</div>
      <div class="stat-label">Average Score</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${uniqueStudents}</div>
      <div class="stat-label">Active Students</div>
    </div>
    <div class="stat-box">
      <div class="stat-value">${averageTime.toFixed(0)}m</div>
      <div class="stat-label">Avg Time/Test</div>
    </div>
  `;
}

export const GET = requireAdmin(exportAnalyticsHandler);