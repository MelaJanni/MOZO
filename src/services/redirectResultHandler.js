import { getAuth } from '@/services/firebase'
import { GoogleAuthProvider } from 'firebase/auth'

export async function checkForRedirectResult() {
  try {
    console.log('🔍 Checking for Firebase redirect result...')
    
    const auth = await getAuth()
    if (!auth) {
      console.log('🔍 Firebase Auth not initialized')
      return null
    }
    
    const { getRedirectResult } = await import('firebase/auth')
    const result = await getRedirectResult(auth)
    
    if (result) {
      console.log('✅ Found redirect result:', result.user.email)
      
      const user = result.user
      const credential = GoogleAuthProvider.credentialFromResult(result)
      
      return {
        token: await user.getIdToken(),
        email: user.email,
        name: user.displayName,
        imageUrl: user.photoURL,
        uid: user.uid,
        accessToken: credential?.accessToken
      }
    } else {
      console.log('🔍 No redirect result found')
      return null
    }
    
  } catch (error) {
    console.error('❌ Error checking redirect result:', error)
    return null
  }
}