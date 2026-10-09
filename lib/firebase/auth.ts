import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  updateProfile,
  User,
} from 'firebase/auth';
import { auth } from './config';

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName: string
): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (fullName) {
    await updateProfile(userCredential.user, {
      displayName: fullName,
    });
  }
  return userCredential.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function changePassword(newPassword: string): Promise<void> {
  if (!auth.currentUser) {
    throw new Error('No user is currently signed in.');
  }
  await updatePassword(auth.currentUser, newPassword);
}
