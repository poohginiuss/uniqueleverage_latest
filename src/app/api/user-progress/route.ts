import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { executeQuery } from '@/lib/mysql';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = users[0].id;

    // Get user progress
    const progress = await executeQuery(
      'SELECT step1_completed, step2_completed, step3_completed FROM user_progress WHERE user_id = ?',
      [userId]
    ) as any[];

    if (progress.length === 0) {
      // Create initial progress record
      await executeQuery(
        'INSERT INTO user_progress (user_id, step1_completed, step2_completed, step3_completed) VALUES (?, ?, ?, ?)',
        [userId, false, false, false]
      );
      return NextResponse.json({
        step1Completed: false,
        step2Completed: false,
        step3Completed: false
      });
    }

    return NextResponse.json({
      step1Completed: progress[0].step1_completed,
      step2Completed: progress[0].step2_completed,
      step3Completed: progress[0].step3_completed
    });

  } catch (error) {
    console.error('Error fetching user progress:', error);
    return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = Buffer.from(sessionToken, 'base64').toString('utf-8');
    const { email } = JSON.parse(decoded);

    const users = await executeQuery('SELECT id FROM users WHERE email = ?', [email]) as any[];
    if (!users || users.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = users[0].id;

    const { step } = await request.json();

    if (!step || !['step1', 'step2', 'step3'].includes(step)) {
      return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
    }

    const column = `${step}_completed`;
    
    // Update progress
    await executeQuery(
      `INSERT INTO user_progress (user_id, ${column}) VALUES (?, ?) ON DUPLICATE KEY UPDATE ${column} = ?`,
      [userId, true, true]
    );

    return NextResponse.json({ success: true, message: `${step} marked as completed` });

  } catch (error) {
    console.error('Error updating user progress:', error);
    return NextResponse.json({ error: 'Failed to update user progress' }, { status: 500 });
  }
}
