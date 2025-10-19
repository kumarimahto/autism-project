
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { getStorage, ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || ''
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const auth = getAuth(app)
const storage = getStorage(app)

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


export async function saveFaceImage(imageDataUrl, emotionData) {
  try {
    console.log('🔄 Firebase Auth Status:', { signedIn: anonSignedIn, error: anonSignError });
    
    if (!anonSignedIn) {
      console.log('🔄 Attempting Firebase authentication...');
      // Try to sign in if not already signed in
      await signInAnonymously(auth);
      // Wait a bit for auth state to update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (!anonSignedIn) {
        throw new Error('Firebase authentication required - please refresh the page');
      }
    }
    
  
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }

    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileName = `face-scans/${timestamp}_${randomId}.jpg`;
    
    console.log('📁 Creating storage reference:', fileName);
    
    // Create storage reference
    const storageRef = ref(storage, fileName);
    
   
    const response = await fetch(imageDataUrl);
    const blob = await response.blob();
    
    console.log('📤 Uploading image blob...');
    
   
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: 'image/jpeg',
      customMetadata: {
        'uploadedBy': 'autism-screening-tool',
        'timestamp': new Date().toISOString()
      }
    });
    

    const downloadURL = await getDownloadURL(snapshot.ref);
    

    const faceScansCol = collection(db, 'face_scans');
    const docData = {
      imageUrl: downloadURL,
      imagePath: fileName,
      emotionData: emotionData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };
    
    const doc = await addDoc(faceScansCol, docData);
    
    console.log('Face image saved to Firebase:', { id: doc.id, url: downloadURL });
    
    return { 
      success: true,
      id: doc.id, 
      imageUrl: downloadURL,
      imagePath: fileName
    };
    
  } catch (error) {
    console.error('Firebase face image save error:', error);
    return { 
      success: false,
      error: error?.message || String(error), 
      code: error?.code 
    };
  }
}


export async function saveEmotionDataOnly(emotionData) {
  try {
    if (!anonSignedIn) {
      throw new Error('Firebase authentication required');
    }


    const emotionCol = collection(db, 'emotion_analyses');
    const docData = {
      emotionData: emotionData,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      method: 'local_analysis_without_image'
    };
    
    const doc = await addDoc(emotionCol, docData);
    
    console.log('✅ Emotion data saved to Firestore (without image):', doc.id);
    
    return { 
      success: true,
      id: doc.id,
      method: 'emotion_data_only'
    };
    
  } catch (error) {
    console.error('Firestore emotion save error:', error);
    return { 
      success: false,
      error: error?.message || String(error), 
      code: error?.code 
    };
  }
}

export function getAnonAuthStatus() {
  return { signedIn: anonSignedIn, error: anonSignError }
}

export default app
