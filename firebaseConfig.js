// Firebase kütüphanesinden gerekli fonksiyonları import ediyoruz
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Sizin tarafınızdan sağlanan Firebase proje bilgileri
const firebaseConfig = {
  apiKey: "AIzaSyBNov0j7O4a8HtbL7N3D2Bx2PLoAI9L3i0",
  authDomain: "boyamauygulamasi.firebaseapp.com",
  projectId: "boyamauygulamasi",
  storageBucket: "boyamauygulamasi.appspot.com", // .appspot.com ile bitmeli
  messagingSenderId: "871046823088",
  appId: "1:871046823088:web:52a737f22d244f71c30f75"
};

// Firebase uygulamasını başlatıyoruz
const app = initializeApp(firebaseConfig);

// Diğer dosyalardan erişebilmek için Firestore ve Storage servislerini export ediyoruz
export const db = getFirestore(app);
export const storage = getStorage(app);