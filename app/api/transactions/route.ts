import { NextRequest, NextResponse } from 'next/server';
import {
  getUserTransactions,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '@/lib/db/repositories';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const type = searchParams.get('type') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const transactions = await getUserTransactions(userId, {
      startDate,
      endDate,
      type,
      categoryId,
    });

    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error('API transactions GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, title, amount, type, categoryId, date, paymentMethod, notes } = body;

    if (!userId || !title || !amount || !type || !date) {
      return NextResponse.json(
        { error: 'userId, title, amount, type, and date are required' },
        { status: 400 }
      );
    }

    const created = await createTransaction(userId, {
      title,
      amount: Number(amount),
      type,
      categoryId: categoryId || null,
      date,
      paymentMethod: paymentMethod || 'Cash',
      notes: notes || null,
    });

    return NextResponse.json({ transaction: created });
  } catch (error: any) {
    console.error('API transactions POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, transactionId, title, amount, type, categoryId, date, paymentMethod, notes } =
      body;

    if (!userId || !transactionId) {
      return NextResponse.json(
        { error: 'userId and transactionId are required' },
        { status: 400 }
      );
    }

    const updated = await updateTransaction(userId, transactionId, {
      title,
      amount: Number(amount),
      type,
      categoryId: categoryId || null,
      date,
      paymentMethod,
      notes: notes || null,
    });

    return NextResponse.json({ transaction: updated });
  } catch (error: any) {
    console.error('API transactions PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const transactionId = searchParams.get('transactionId');

    if (!userId || !transactionId) {
      return NextResponse.json(
        { error: 'userId and transactionId are required' },
        { status: 400 }
      );
    }

    await deleteTransaction(userId, transactionId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API transactions DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
