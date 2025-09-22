cat > src/firebase.ts <<'EOF'
import { initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import fs from "fs";

// Load service account JSON from the file we put in backend/
const serviceAccount = JSON.parse(fs.readFileSync("service-account.json", "utf8"));

const app = initializeApp({
  credential: cert(serviceAccount),
});

export const adminAuth = getAuth(app);
EOF
