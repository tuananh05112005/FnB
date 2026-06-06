// ==============================================================
// TÊN FILE: firebase.js
// MÔ TẢ: Khởi tạo và cấu hình Firebase Web SDK cho ứng dụng Client.
//        Cấu hình mã API key và dịch vụ xác thực (Firebase Authentication)
//        hỗ trợ đăng nhập nhanh bằng tài khoản Google (GoogleAuthProvider).
// ==============================================================

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Cấu hình kết nối Firebase app
const firebaseConfig = {
    apiKey: "AIzaSyACRKaBE0Izjo8oHuG8mlpUPvwo3YCa0Kk",
    authDomain: "prdrink-a0496.firebaseapp.com",
    projectId: "prdrink-a0496",
    storageBucket: "prdrink-a0496.firebasestorage.app",
    messagingSenderId: "78064504227",
    appId: "1:78064504227:web:32b483218a6b13a08d5e16",
    measurementId: "G-WJBTD1JW50"
};

// Khởi tạo thực thể Firebase App
const app = initializeApp(firebaseConfig);
// Khởi tạo dịch vụ Authentication
const auth = getAuth(app);
// Khởi tạo nhà cung cấp dịch vụ đăng nhập Google
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider,  signInWithPopup };