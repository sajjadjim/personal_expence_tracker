import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateProfile, updateProfile } from '@/lib/db/repositories';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const email = searchParams.get('email') || 'user@example.com';
    const fullName = searchParams.get('fullName') || '';

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const profile = await getOrCreateProfile(userId, email, fullName);
    return NextResponse.json({ profile });
  } catch (error: any) {
    console.error('API profile error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      fullName,
      age,
      currentIncome,
      address,
      mobileNumber,
      currencyCode,
      currencySymbol,
      dateFormat,
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    const parsedAge = age !== undefined && age !== null && age !== '' ? Number(age) : null;
    const parsedIncome = currentIncome !== undefined && currentIncome !== null && currentIncome !== '' ? Number(currentIncome) : null;

    const updated = await updateProfile(userId, {
      fullName,
      age: parsedAge,
      currentIncome: parsedIncome,
      address: address !== undefined ? address : undefined,
      mobileNumber: mobileNumber !== undefined ? mobileNumber : undefined,
      currencyCode,
      currencySymbol,
      dateFormat,
    });

    return NextResponse.json({ profile: updated });
  } catch (error: any) {
    console.error('API profile update error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
