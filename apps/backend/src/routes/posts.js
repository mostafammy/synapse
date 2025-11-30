const express = require("express");
const router = express.Router();
const prisma = require("../config/db");
const { authenticateToken } = require("../middleware/auth");

// Get Feed (All posts for MVP)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, name: true, image: true },
        },
        _count: {
          select: { likes: true, comments: true },
        },
        likes: {
          where: { user: { email: req.user.email } },
          select: { userId: true },
        },
      },
    });

    // Transform to add "isLiked" field
    const feed = posts.map((post) => ({
      ...post,
      isLiked: post.likes.length > 0,
    }));

    res.json(feed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Post
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content)
      return res.status(400).json({ message: "Content is required" });

    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    const post = await prisma.post.create({
      data: {
        content,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Like/Unlike Post
router.post("/:id/like", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    const existingLike = await prisma.like.findUnique({
      where: {
        postId_userId: {
          postId,
          userId: user.id,
        },
      },
    });

    if (existingLike) {
      await prisma.like.delete({
        where: { postId_userId: { postId, userId: user.id } },
      });
      res.json({ message: "Unliked" });
    } else {
      await prisma.like.create({
        data: { postId, userId: user.id },
      });
      res.json({ message: "Liked" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Comment on Post
router.post("/:id/comment", authenticateToken, async (req, res) => {
  try {
    const { content } = req.body;
    const postId = req.params.id;
    const user = await prisma.user.findUnique({
      where: { email: req.user.email },
    });

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId: user.id,
      },
      include: {
        author: { select: { id: true, name: true, image: true } },
      },
    });

    res.json(comment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
