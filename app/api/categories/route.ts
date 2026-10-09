import { NextRequest, NextResponse } from 'next/server';
import {
  getUserCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  seedDefaultCategories,
} from '@/lib/db/repositories';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const categories = await getUserCategories(userId);
    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('API categories GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, action, name, type, icon, color } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (action === 'seed') {
      await seedDefaultCategories(userId);
      const categories = await getUserCategories(userId);
      return NextResponse.json({ success: true, categories });
    }

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const created = await createCategory(userId, { name, type, icon, color });
    return NextResponse.json({ category: created });
  } catch (error: any) {
    console.error('API categories POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, categoryId, name, type, icon, color } = body;

    if (!userId || !categoryId) {
      return NextResponse.json({ error: 'userId and categoryId are required' }, { status: 400 });
    }

    const updated = await updateCategory(userId, categoryId, { name, type, icon, color });
    return NextResponse.json({ category: updated });
  } catch (error: any) {
    console.error('API categories PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const categoryId = searchParams.get('categoryId');

    if (!userId || !categoryId) {
      return NextResponse.json({ error: 'userId and categoryId are required' }, { status: 400 });
    }

    await deleteCategory(userId, categoryId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API categories DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
