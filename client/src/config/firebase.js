import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyACRKaBE0Izjo8oHuG8mlpUPvwo3YCa0Kk",
    authDomain: "prdrink-a0496.firebaseapp.com",
    projectId: "prdrink-a0496",
    storageBucket: "prdrink-a0496.firebasestorage.app",
    messagingSenderId: "78064504227",
    appId: "1:78064504227:web:32b483218a6b13a08d5e16",
    measurementId: "G-WJBTD1JW50"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();


export { auth, googleProvider,  signInWithPopup };