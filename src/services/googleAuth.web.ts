import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { auth } from '../firebaseConfig';

type GoogleAuthResult = { userId: string; email?: string | null };

export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  const provider = new GoogleAuthProvider();
  const userCredential = await signInWithPopup(auth, provider);
  const user = userCredential.user;
  return { userId: user.uid, email: user.email };
}
