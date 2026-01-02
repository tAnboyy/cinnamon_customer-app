import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { auth } from '../firebaseConfig';

type GoogleAuthResult = { userId: string; email?: string | null };

export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  // Ensure Google Play Services on Android
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  // Start sign-in
  const userInfo = await GoogleSignin.signIn();
  const idToken = userInfo.data?.idToken;
  if (!idToken) {
    throw new Error('No idToken returned from Google Sign-In');
  }

  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(auth, credential);
  const user = userCredential.user;
  return { userId: user.uid, email: user.email };
}
