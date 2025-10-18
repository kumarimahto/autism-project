// Firebase Storage Security Rules
// Copy and paste these rules in Firebase Console -> Storage -> Rules

rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow read/write access to face-scans for authenticated users
    match /face-scans/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    // Allow read access to other files for authenticated users
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && resource.size < 5 * 1024 * 1024; // 5MB limit
    }
  }
}

// Firebase Firestore Security Rules
// Copy and paste these rules in Firebase Console -> Firestore -> Rules

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Existing analysis_results collection
    match /analysis_results/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Add face_scans collection for emotion data
    match /face_scans/{document} {
      allow read, write: if request.auth != null;
    }
    
    // Add emotion_analyses collection (fallback)
    match /emotion_analyses/{document} {
      allow read, write: if request.auth != null;
    }
  }
}