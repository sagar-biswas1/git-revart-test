const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 4000;
const cors = require("cors");

// Enable CORS for all routes
app.use(cors());
// Read the JSON file
const rawDiscussionData = fs.readFileSync("./discuss.json");
const discussionData = JSON.parse(rawDiscussionData);

const rawLatestPostsData = fs.readFileSync("./latestPosts.json");
const latestPostsData = JSON.parse(rawLatestPostsData);

// Define a route to get all posts
app.get("/api/v1/discussion", (req, res) => {
  let category = req.query.category;
  if (category) {
    const filteredData = discussionData.posts.filter((post) => {
      return post?.category?.toLowerCase() === category.toLowerCase();
    });
    if (filteredData) {
      return res.json(filteredData);
    }
  }
  return res.json(discussionData);
});

// Define a route to get a specific post by ID
app.get("/api/v1/discussion/:id", (req, res) => {
  const Id = parseInt(req.params.id);
  const post = discussionData.posts.find((post) => post.id === Id);
  if (post) {
    return res.json(post);
  } else {
    return res.status(404).json({ message: "Post not found" });
  }
});



// route for latest posts
app.get("/api/v1/latest-posts", (req, res) => {
  return res.json(latestPostsData);
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
