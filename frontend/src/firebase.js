// Firebase initialization (client)
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'

const firebaseConfig = {
  apiKey: 'AIzaSyApPlFF2RqfQmwP9mCSBE9bOhQaG74l2hg',
  authDomain: 'autism-3f89f.firebaseapp.com',
  projectId: 'autism-3f89f',
  storageBucket: 'autism-3f89f.firebasestorage.app',
  messagingSenderId: '789412157063',
  appId: '1:789412157063:web:663f5480a3b61ba7e44a22',
  measurementId: 'G-KSKPXEXYKT'
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)

// Sign in anonymously on module load so Firestore writes can be allowed by rules
let anonSignedIn = false
let anonSignError = null
signInAnonymously(auth)
  .then(() => {
    anonSignedIn = true
    console.log('Firebase: signed in anonymously')
  })
  .catch((err) => {
    anonSignError = err?.message || String(err)
    console.warn('Firebase anonymous sign-in failed:', anonSignError)
  })

// Optional: expose auth state change for debugging in console
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('Firebase auth state: signed in (uid=', user.uid, ')')
  } else {
    console.log('Firebase auth state: signed out')
  }
})

export async function saveResult(result) {
  try {
    const col = collection(db, 'analysis_results')
    const doc = await addDoc(col, { ...result, createdAt: new Date().toISOString() })
    return { id: doc.id }
  } catch (e) {
    console.error('Firebase save error', e)
    // return error details to the caller for debugging (include code when available)
    return { error: e?.message || String(e), code: e?.code }
  }
}

export function getAnonAuthStatus() {
  return { signedIn: anonSignedIn, error: anonSignError }
}

export default app
