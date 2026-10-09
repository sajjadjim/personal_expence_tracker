import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    const db = await getDatabase();
    const collections = await db.listCollections().toArray();
    return NextResponse.json({
      success: true,
      message: 'Successfully connected to MongoDB Atlas!',
      database: db.databaseName,
      collections: collections.map((c) => c.name),
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'MongoDB Atlas connection failed.',
        error: error.message,
        tip: error.message.includes('bad auth')
          ? 'Authentication failed: Please verify that the database username and password in MongoDB Atlas -> Database Access match.'
          : error.message,
      },
      { status: 500 }
    );
  }
}
