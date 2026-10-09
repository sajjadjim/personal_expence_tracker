import { ObjectId } from 'mongodb';
import { getDatabase } from '@/lib/mongodb';
import {
  MongoProfile,
  MongoCategory,
  MongoTransaction,
  MongoBudget,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from './models';

// ------------------------------------------------------------------------------
// PROFILES REPOSITORY
// ------------------------------------------------------------------------------

export async function getOrCreateProfile(
  userId: string,
  email: string,
  fullName?: string
): Promise<MongoProfile> {
  const db = await getDatabase();
  const collection = db.collection<MongoProfile>('profiles');

  let profile = await collection.findOne({ userId });

  if (!profile) {
    const newProfile: MongoProfile = {
      userId,
      email,
      fullName: fullName || email.split('@')[0],
      currencyCode: 'BDT',
      currencySymbol: '৳',
      dateFormat: 'DD/MM/YYYY',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newProfile);
    profile = { ...newProfile, _id: result.insertedId };

    // Automatically seed default categories for new profile
    await seedDefaultCategories(userId);
  }

  return profile;
}

export async function updateProfile(
  userId: string,
  updates: Partial<Pick<MongoProfile, 'fullName' | 'currencyCode' | 'currencySymbol' | 'dateFormat'>>
): Promise<MongoProfile | null> {
  const db = await getDatabase();
  const collection = db.collection<MongoProfile>('profiles');

  const result = await collection.findOneAndUpdate(
    { userId },
    {
      $set: {
        ...updates,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result;
}

// ------------------------------------------------------------------------------
// CATEGORIES REPOSITORY
// ------------------------------------------------------------------------------

export async function seedDefaultCategories(userId: string): Promise<void> {
  const db = await getDatabase();
  const collection = db.collection<MongoCategory>('categories');

  const existingCount = await collection.countDocuments({ userId });
  if (existingCount > 0) return;

  const now = new Date();
  const allDefaults = [
    ...DEFAULT_EXPENSE_CATEGORIES.map((c) => ({
      userId,
      ...c,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    })),
    ...DEFAULT_INCOME_CATEGORIES.map((c) => ({
      userId,
      ...c,
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    })),
  ];

  await collection.insertMany(allDefaults);
}

export async function getUserCategories(userId: string): Promise<any[]> {
  const db = await getDatabase();
  const collection = db.collection<MongoCategory>('categories');

  const categories = await collection.find({ userId }).sort({ name: 1 }).toArray();

  return categories.map((c) => ({
    id: c._id.toString(),
    user_id: c.userId,
    name: c.name,
    type: c.type,
    icon: c.icon,
    color: c.color,
    is_default: c.isDefault,
    created_at: c.createdAt.toISOString(),
    updated_at: c.updatedAt.toISOString(),
  }));
}

export async function createCategory(
  userId: string,
  data: { name: string; type: 'income' | 'expense'; icon: string; color: string }
) {
  const db = await getDatabase();
  const collection = db.collection<MongoCategory>('categories');

  const newCat: MongoCategory = {
    userId,
    name: data.name,
    type: data.type,
    icon: data.icon,
    color: data.color,
    isDefault: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(newCat);
  return { ...newCat, id: result.insertedId.toString() };
}

export async function updateCategory(
  userId: string,
  categoryId: string,
  data: { name?: string; type?: 'income' | 'expense'; icon?: string; color?: string }
) {
  const db = await getDatabase();
  const collection = db.collection<MongoCategory>('categories');

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(categoryId), userId },
    {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result;
}

export async function deleteCategory(userId: string, categoryId: string) {
  const db = await getDatabase();
  const catCollection = db.collection<MongoCategory>('categories');
  const txCollection = db.collection<MongoTransaction>('transactions');

  // Delete category
  await catCollection.deleteOne({ _id: new ObjectId(categoryId), userId });

  // Unlink from transactions
  await txCollection.updateMany(
    { userId, categoryId },
    { $set: { categoryId: null, updatedAt: new Date() } }
  );

  return true;
}

// ------------------------------------------------------------------------------
// TRANSACTIONS REPOSITORY
// ------------------------------------------------------------------------------

export async function getUserTransactions(
  userId: string,
  filters?: {
    startDate?: string;
    endDate?: string;
    type?: string;
    categoryId?: string;
  }
) {
  const db = await getDatabase();
  const collection = db.collection<MongoTransaction>('transactions');

  const query: any = { userId };

  if (filters?.startDate && filters?.endDate) {
    query.date = { $gte: filters.startDate, $lte: filters.endDate };
  } else if (filters?.startDate) {
    query.date = { $gte: filters.startDate };
  } else if (filters?.endDate) {
    query.date = { $lte: filters.endDate };
  }

  if (filters?.type && filters.type !== 'all') {
    query.type = filters.type;
  }

  if (filters?.categoryId && filters.categoryId !== 'all') {
    query.categoryId = filters.categoryId;
  }

  const transactions = await collection
    .find(query)
    .sort({ date: -1, createdAt: -1 })
    .toArray();

  // Load all user categories to map onto transactions
  const categories = await getUserCategories(userId);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return transactions.map((t) => ({
    id: t._id.toString(),
    user_id: t.userId,
    category_id: t.categoryId,
    title: t.title,
    amount: t.amount,
    type: t.type,
    date: t.date,
    payment_method: t.paymentMethod,
    notes: t.notes || null,
    created_at: t.createdAt.toISOString(),
    updated_at: t.updatedAt.toISOString(),
    category: t.categoryId ? catMap.get(t.categoryId) || null : null,
  }));
}

export async function createTransaction(
  userId: string,
  data: {
    title: string;
    amount: number;
    type: 'income' | 'expense';
    categoryId?: string | null;
    date: string;
    paymentMethod: string;
    notes?: string | null;
  }
) {
  const db = await getDatabase();
  const collection = db.collection<MongoTransaction>('transactions');

  const newTx: MongoTransaction = {
    userId,
    title: data.title,
    amount: data.amount,
    type: data.type,
    categoryId: data.categoryId || null,
    date: data.date,
    paymentMethod: data.paymentMethod,
    notes: data.notes || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await collection.insertOne(newTx);
  return { ...newTx, id: result.insertedId.toString() };
}

export async function updateTransaction(
  userId: string,
  transactionId: string,
  data: Partial<MongoTransaction>
) {
  const db = await getDatabase();
  const collection = db.collection<MongoTransaction>('transactions');

  const result = await collection.findOneAndUpdate(
    { _id: new ObjectId(transactionId), userId },
    {
      $set: {
        ...data,
        updatedAt: new Date(),
      },
    },
    { returnDocument: 'after' }
  );

  return result;
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const db = await getDatabase();
  const collection = db.collection<MongoTransaction>('transactions');

  const result = await collection.deleteOne({
    _id: new ObjectId(transactionId),
    userId,
  });

  return result.deletedCount > 0;
}

// ------------------------------------------------------------------------------
// BUDGETS REPOSITORY
// ------------------------------------------------------------------------------

export async function getUserBudgets(userId: string, month: string) {
  const db = await getDatabase();
  const collection = db.collection<MongoBudget>('budgets');

  const budgets = await collection.find({ userId, month }).toArray();
  const categories = await getUserCategories(userId);
  const catMap = new Map(categories.map((c) => [c.id, c]));

  return budgets.map((b) => ({
    id: b._id.toString(),
    user_id: b.userId,
    category_id: b.categoryId,
    month: b.month,
    amount: b.amount,
    created_at: b.createdAt.toISOString(),
    updated_at: b.updatedAt.toISOString(),
    category: catMap.get(b.categoryId) || null,
  }));
}

export async function upsertBudget(
  userId: string,
  data: { categoryId: string; month: string; amount: number }
) {
  const db = await getDatabase();
  const collection = db.collection<MongoBudget>('budgets');

  const result = await collection.findOneAndUpdate(
    { userId, categoryId: data.categoryId, month: data.month },
    {
      $set: {
        amount: data.amount,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        userId,
        categoryId: data.categoryId,
        month: data.month,
        createdAt: new Date(),
      },
    },
    { upsert: true, returnDocument: 'after' }
  );

  return result;
}

export async function deleteBudget(userId: string, budgetId: string) {
  const db = await getDatabase();
  const collection = db.collection<MongoBudget>('budgets');

  const result = await collection.deleteOne({
    _id: new ObjectId(budgetId),
    userId,
  });

  return result.deletedCount > 0;
}
