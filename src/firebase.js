import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore} from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCU8u7o1P-AS3VKwkUYWlZe_c66u0xoPYM",
    authDomain: "transaction-7dd36.firebaseapp.com",
    projectId: "transaction-7dd36",
    storageBucket: "transaction-7dd36.appspot.com",
    messagingSenderId: "611736024779",
    appId: "1:611736024779:web:08102fa079248d86e9cd4e"
  };

const app = initializeApp(firebaseConfig);
const db = getFirestore();

export const auth = getAuth(app);
export default db;