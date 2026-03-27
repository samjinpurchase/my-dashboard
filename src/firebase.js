import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyADukd9XlxKOg4AVDuPtDBGZVAIikbwS0Q",
  authDomain: "samjin-dashboard.firebaseapp.com",
  projectId: "samjin-dashboard",
  storageBucket: "samjin-dashboard.firebasestorage.app",
  messagingSenderId: "663692651712",
  appId: "1:663692651712:web:413da499032abc24475125",
  measurementId: "G-LS1CFR6ZVZ"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// 허용된 이메일 목록
export const ALLOWED_EMAILS = [
  "samjinpurchase@gmail.com",  // 호스트
];

// 호스트 이메일 목록
export const HOST_EMAILS = [
  "samjinpurchase@gmail.com",
];

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const logout = () => signOut(auth);