
import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth'
import { getStorage, ref, uploadString, uploadBytes, getDownloadURL } from 'firebase/storage'

// Check if Firebase config is properly set
const isFirebaseConfigured = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return apiKey && apiKey !== 'demo-key' && projectId && projectId !== 'demo-project';
};

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'demo-key',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef123456',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-ABCDEF123'
};

let app = null;
let db = null;
let auth = null;
let storage = null;

// Only initialize Firebase if properly configured
if (isFirebaseConfigured()) {
  try {
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    storage = getStorage(app);
    console.log('✅ Firebase initialized successfully');
  } catch (error) {
    console.warn('⚠️ Firebase initialization failed:', error.message);
  }
} else {
  console.log('ℹ️ Firebase not configured - running in offline mode');
}

// Firebase authentication (only if configured)
let anonSignedIn = false;
let anonSignError = null;

if (auth) {
  // Sign in anonymously only if Firebase is properly configured
  signInAnonymously(auth)
    .then(() => {
      anonSignedIn = true;
      console.log('✅ Firebase: signed in anonymously');
    })
    .catch((err) => {
      anonSignError = err?.message || String(err);
      console.warn('⚠️ Firebase anonymous sign-in failed:', anonSignError);
    });

  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('✅ Firebase auth state: signed in (uid=', user.uid, ')');
    } else {
      console.log('ℹ️ Firebase auth state: signed out');
    }
  });
} else {
  console.log('ℹ️ Firebase auth not available - running without authentication');
}

export async function saveResult(result) {
  if (!db) {
    console.log('ℹ️ Firebase not configured - result not saved to cloud');
    return { offline: true, message: 'Saved locally only (Firebase not configured)' };
  }
  
  try {
    const col = collection(db, 'analysis_results');
    const doc = await addDoc(col, { ...result, createdAt: new Date().toISOString() });
    console.log('✅ Result saved to Firebase:', doc.id);
    return { id: doc.id };
  } catch (e) {
    console.error('⚠️ Firebase save error:', e);
    return { error: e?.message || String(e), code: e?.code };
  }
}


export async function saveFaceImage(imageDataUrl, emotionData) {
  if (!auth || !storage || !db) {
    console.log('ℹ️ Firebase not configured - face image not saved to cloud');
    return { 
      success: true, 
      offline: true, 
      message: 'Image processed locally (Firebase not configured)' 
    };
  }

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
  if (!db) {
    console.log('ℹ️ Firebase not configured - emotion data not saved to cloud');
    return { 
      success: true, 
      offline: true, 
      message: 'Emotion data processed locally (Firebase not configured)' 
    };
  }

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
