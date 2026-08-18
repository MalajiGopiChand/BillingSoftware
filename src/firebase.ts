import { initializeApp } from "firebase/app";

import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyCwzSpZS3eTECQ6OvxCLAX8xA77EWIkmBA",
  authDomain: "billingsoftware-cdb39.firebaseapp.com",
  projectId: "billingsoftware-cdb39",
  storageBucket: "billingsoftware-cdb39.firebasestorage.app",
  messagingSenderId: "961869203935",
  appId: "1:961869203935:web:9c049f025b3ec56f049c6a",
  measurementId: "G-VDPV3VPG82"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
