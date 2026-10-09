import { NextRequest, NextResponse } from 'next/server';
import {
  getUserBudgets,
  upsertBudget,
  deleteBudget,
  getUserTransactions,
} from '@/lib/db/repositories';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const month = searchParams.get('month'); // YYYY-MM

    if (!userId || !month) {
      return NextResponse.json(
        { error: 'userId and month are required' },
        { status: 400 }
      );
    }

    const budgets = await getUserBudgets(userId, month);

    // Calculate spent amount from transactions in this month
    const [year, monthNum] = month.split('-');
    const startDate = `${year}-${monthNum}-01`;
    const lastDay = new Date(Number(year), Number(monthNum), 0).getDate();
    const endDate = `${year}-${monthNum}-${String(lastDay).padStart(2, '0')}`;

    const transactions = await getUserTransactions(userId, {
      startDate,
      endDate,
      type: 'expense',
    });

    const spentMap: Record<string, number> = {};
    transactions.forEach((tx) => {
      if (tx.category_id) {
        spentMap[tx.category_id] = (spentMap[tx.category_id] || 0) + Number(tx.amount);
      }
    });

    return NextResponse.json({ budgets, spentMap });
  } catch (error: any) {
    console.error('API budgets GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, categoryId, month, amount } = body;

    if (!userId || !categoryId || !month || !amount) {
      return NextResponse.json(
        { error: 'userId, categoryId, month, and amount are required' },
        { status: 400 }
      );
    }

    const budget = await upsertBudget(userId, {
      categoryId,
      month,
      amount: Number(amount),
    });

    return NextResponse.json({ budget });
  } catch (error: any) {
    console.error('API budgets POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const budgetId = searchParams.get('budgetId');

    if (!userId || !budgetId) {
      return NextResponse.json(
        { error: 'userId and budgetId are required' },
        { status: 400 }
      );
    }

    await deleteBudget(userId, budgetId);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API budgets DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
