import { Router } from "express";
import { verifyFirebaseToken } from "../middleware.auth";

const router = Router();

// Get my profile
router.get("/me", verifyFirebaseToken, (req, res) => {
  const user = (req as any).user; // set by middleware
  res.json({
    uid: user.uid,
    email: user.email,
    message: "This is your profile 🚀"
  });
});

// Update my profile
router.post("/me", verifyFirebaseToken, (req, res) => {
  const user = (req as any).user;
  const body = req.body;

  // For now, just echo back what user sent
  res.json({
    uid: user.uid,
    updated: body
  });
});

export default router;
