const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

// Get Current User
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // req.user comes from the JWT. NextAuth usually puts email or sub (id) in it.
    // We need to find the user by email or provider account id.
    // Since we are using Google Provider, the email should be reliable.
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
      include: {
        _count: {
          select: { posts: true, followers: true, following: true },
        },
      },
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get User by ID
router.get("/:id", async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        posts: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
        _count: {
          select: { followers: true, following: true },
        },
      },
    });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Follow/Unfollow User
router.post("/:id/follow", authenticateToken, async (req, res) => {
  try {
    const followerEmail = req.user.email;
    const followingId = req.params.id;

    const follower = await prisma.user.findUnique({
      where: { email: followerEmail },
    });
    if (!follower)
      return res.status(404).json({ message: "Current user not found" });

    if (follower.id === followingId) {
      return res.status(400).json({ message: "Cannot follow yourself" });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: follower.id,
          followingId: followingId,
        },
      },
    });

    if (existingFollow) {
      // Unfollow
      await prisma.follow.delete({
        where: {
          followerId_followingId: {
            followerId: follower.id,
            followingId: followingId,
          },
        },
      });
      res.json({ message: "Unfollowed" });
    } else {
      // Follow
      await prisma.follow.create({
        data: {
          followerId: follower.id,
          followingId: followingId,
        },
      });
      res.json({ message: "Followed" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
