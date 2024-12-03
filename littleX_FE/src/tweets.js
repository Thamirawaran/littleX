const token = localStorage.getItem("authToken");
if (!token) {
  window.location.href = "index.html";
}

const BASE_URL = "http://0.0.0.0:8000/walker";
const isProfilePage = window.location.pathname.includes("profile.html");

let currentUserProfile = null;

document.getElementById("logoutButton").addEventListener("click", () => {
  localStorage.removeItem("authToken");
  window.location.href = "index.html";
});

async function loadCurrentUserProfile() {
  try {
    const response = await fetch(`${BASE_URL}/get_profile`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error("Failed to load profile");
    const data = await response.json();
    if (data.reports && data.reports.length > 0) {
      currentUserProfile = data.reports[0];
      const usernameElement = document.getElementById("username");
      if (usernameElement) {
        usernameElement.textContent =
          currentUserProfile.context.username || "Anonymous";
      }
      return currentUserProfile;
    }
  } catch (error) {
    console.error("Error loading profile:", error);
    const usernameElement = document.getElementById("username");
    if (usernameElement) {
      usernameElement.textContent = "Anonymous";
    }
  }
}

async function loadProfilesToFollow() {
  try {
    const response = await fetch(`${BASE_URL}/load_user_profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error("Failed to load profiles");
    const data = await response.json();

    if (data.reports && data.reports.length > 0) {
      const profiles = data.reports[0];
      const followListElement = document.getElementById("followList");
      followListElement.innerHTML = "";

      const profilesToShow = profiles.filter((profile) => {
        if (
          currentUserProfile &&
          profile.name === currentUserProfile.context.username
        ) {
          return false;
        }
        if (currentUserProfile?.context.followees?.includes(profile.id)) {
          return false;
        }
        return true;
      });

      if (profilesToShow.length === 0) {
        followListElement.innerHTML =
          '<div class="md-list-item">No new profiles to follow</div>';
        return;
      }

      profilesToShow.forEach((profile) => {
        const template = document.getElementById("profile-template");
        const profileElement = template.content.cloneNode(true);

        profileElement.querySelector(".profile-name").textContent =
          profile.name;
        const followBtn = profileElement.querySelector(".follow-btn");

        followBtn.addEventListener("click", async () => {
          await handleFollow(profile.id, followBtn);
          const listItem = followBtn.closest(".md-list-item");
          if (listItem) {
            listItem.remove();
            if (followListElement.children.length === 0) {
              followListElement.innerHTML =
                '<div class="md-list-item">No new profiles to follow</div>';
            }
          }
        });

        followListElement.appendChild(profileElement);
      });
    }
  } catch (error) {
    console.error("Error:", error);
    const followListElement = document.getElementById("followList");
    followListElement.innerHTML =
      '<div class="md-list-item">Error loading profiles</div>';
  }
}

async function handleFollow(profileId, button) {
  try {
    const response = await fetch(`${BASE_URL}/follow_request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ profile_id: profileId }),
    });

    if (!response.ok) throw new Error("Failed to follow user");

    if (button.classList.contains("following")) {
      button.textContent = "Follow";
      button.classList.remove("following");
    } else {
      button.textContent = "Following";
      button.classList.add("following");
    }

    await loadCurrentUserProfile();
  } catch (error) {
    console.error("Error:", error);
  }
}

function renderComment(comment) {
  const template = document.getElementById("comment-template");
  const commentElement = template.content.cloneNode(true);
  commentElement.querySelector(".username").textContent = comment.username;
  commentElement.querySelector(".content").textContent = comment.content;
  return commentElement;
}

function renderTweet(tweetData) {
  const tweet = tweetData.tweet;
  const comments = tweetData.comments || [];
  const likes = tweetData.likes || [];
  const likeCount = likes.length;
  const isLiked = likes.some(
    (like) => like.username === currentUserProfile?.context?.username
  );

  const template = document.getElementById("tweet-template");
  const tweetElement = template.content.cloneNode(true);

  tweetElement.querySelector(".username").textContent = tweet.username;
  tweetElement.querySelector(".content").textContent =
    tweet.content.context.content;

  const likeBtn = tweetElement.querySelector(".like-btn");
  const likeIcon = likeBtn.querySelector(".material-icons");
  const countSpan = likeBtn.querySelector(".count");

  if (likes.length > 0) {
    const tooltip = document.createElement("div");
    tooltip.className = "like-tooltip";
    const likesList = likes.map((like) => like.username).join(", ");
    tooltip.textContent = `Liked by ${likesList}`;
    likeBtn.appendChild(tooltip);
  }

  if (likeCount > 0) {
    countSpan.textContent = likeCount;
    likeIcon.textContent = isLiked ? "favorite" : "favorite_border";
    likeIcon.style.color = isLiked ? "red" : "";
  } else {
    countSpan.textContent = "";
    likeIcon.textContent = "favorite_border";
    likeIcon.style.color = "";
  }

  const commentBtn = tweetElement.querySelector(".comment-btn");
  const commentsSection = tweetElement.querySelector(".comments-section");
  const commentForm = commentsSection.querySelector(".comment-form");
  commentBtn.querySelector(".count").textContent = comments.length;

  const allCommentsContainer = document.createElement("div");
  allCommentsContainer.className = "all-comments";
  commentsSection.insertBefore(allCommentsContainer, commentForm);

  if (comments.length > 0) {
    const firstComment = comments[0];
    const firstCommentElement = renderComment(firstComment);
    allCommentsContainer.appendChild(firstCommentElement);

    if (comments.length > 1) {
      const remainingComments = document.createElement("div");
      remainingComments.className = "remaining-comments";
      remainingComments.style.display = "none";

      comments.slice(1).forEach((comment) => {
        remainingComments.appendChild(renderComment(comment));
      });

      allCommentsContainer.appendChild(remainingComments);

      const showMoreBtn = document.createElement("button");
      showMoreBtn.className = "md-button md-button-text show-more-comments";
      showMoreBtn.textContent = `Show ${comments.length - 1} more comments`;
      allCommentsContainer.insertBefore(showMoreBtn, remainingComments);

      showMoreBtn.addEventListener("click", () => {
        remainingComments.style.display =
          remainingComments.style.display === "none" ? "block" : "none";
        showMoreBtn.textContent =
          remainingComments.style.display === "none"
            ? `Show ${comments.length - 1} more comments`
            : "Hide comments";
      });
    }
  }

  commentBtn.addEventListener("click", () => {
    const remainingComments = commentsSection.querySelector(
      ".remaining-comments"
    );
    const showMoreBtn = commentsSection.querySelector(".show-more-comments");

    if (remainingComments) {
      remainingComments.style.display = "none";
      if (showMoreBtn) {
        showMoreBtn.textContent = `Show ${comments.length - 1} more comments`;
      }
    }
  });

  likeBtn.addEventListener("click", async () => {
    const icon = likeBtn.querySelector(".material-icons");
    const currentCount = parseInt(countSpan.textContent) || 0;
    let tooltip = likeBtn.querySelector(".like-tooltip");

    if (icon.textContent === "favorite") {
      icon.textContent = "favorite_border";
      icon.style.color = "";
      countSpan.textContent = currentCount > 1 ? currentCount - 1 : "";

      if (currentCount <= 1 && tooltip) {
        tooltip.remove();
      } else if (tooltip) {
        const newLikesList = likes
          .filter(
            (like) => like.username !== currentUserProfile?.context?.username
          )
          .map((like) => like.username)
          .join(", ");
        tooltip.textContent = `Liked by ${newLikesList}`;
      }
    } else {
      icon.textContent = "favorite";
      icon.style.color = "red";
      countSpan.textContent = currentCount + 1;

      if (!tooltip) {
        tooltip = document.createElement("div");
        tooltip.className = "like-tooltip";
        likeBtn.appendChild(tooltip);
      }

      const currentUsername =
        currentUserProfile?.context?.username || "Anonymous";
      const newLikesList = [
        ...likes.map((like) => like.username),
        currentUsername,
      ].join(", ");
      tooltip.textContent = `Liked by ${newLikesList}`;
    }

    await handleLike(tweet.content.id);
  });

  commentForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const content = e.target.querySelector("input").value;
    await handleComment(tweet.content.id, content);
    e.target.reset();
  });

  return tweetElement;
}

function renderTweets(tweetsData) {
  const tweetsDiv = document.getElementById(
    isProfilePage ? "userTweets" : "tweets"
  );
  tweetsDiv.innerHTML = "";
  tweetsData.forEach((tweetData) => {
    if (tweetData.tweet && tweetData.tweet.username) {
      tweetsDiv.appendChild(renderTweet(tweetData));
    }
  });
}

function handleSearch(searchQuery) {
  return fetch(`${BASE_URL}/load_feed`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ search_query: searchQuery }),
  });
}

async function processSearchResponse(response) {
  if (!response.ok) throw new Error("Failed to search tweets");
  const data = await response.json();
  if (data.reports && data.reports.length > 0) {
    const summaryElement = document.getElementById("feed-summary");
    if (summaryElement) {
      summaryElement.textContent = data.reports[0].summary;
    }
    renderTweets(data.reports[0].feeds);
  }
}

const navSearchForm = document.getElementById("navSearchForm");
const contentSearchForm = document.getElementById("searchForm");

if (navSearchForm) {
  navSearchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const searchQuery = document.getElementById("navSearchQuery").value.trim();
    if (!searchQuery) return;

    try {
      const response = await handleSearch(searchQuery);
      await processSearchResponse(response);
      document.getElementById("navSearchQuery").value = "";
      document.getElementById("searchQuery").value = "";
    } catch (error) {
      console.error("Error:", error);
    }
  });
}

if (contentSearchForm) {
  contentSearchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const searchQuery = document.getElementById("searchQuery").value.trim();
    if (!searchQuery) return;

    try {
      const response = await handleSearch(searchQuery);
      await processSearchResponse(response);
      document.getElementById("navSearchQuery").value = "";
      document.getElementById("searchQuery").value = "";
    } catch (error) {
      console.error("Error:", error);
    }
  });
}

const navSearchInput = document.getElementById("navSearchQuery");
const contentSearchInput = document.getElementById("searchQuery");

if (navSearchInput && contentSearchInput) {
  navSearchInput.addEventListener("input", (e) => {
    contentSearchInput.value = e.target.value;
  });

  contentSearchInput.addEventListener("input", (e) => {
    navSearchInput.value = e.target.value;
  });
}

if (!isProfilePage) {
  document
    .getElementById("tweetForm")
    .addEventListener("submit", async function (e) {
      e.preventDefault();
      const content = document.getElementById("tweetContent").value.trim();
      if (!content) return;

      try {
        const response = await fetch(`${BASE_URL}/create_tweet`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ content }),
        });
        if (!response.ok) throw new Error("Failed to create tweet");
        document.getElementById("tweetContent").value = "";
        loadTweets();
      } catch (error) {
        console.error("Error:", error);
      }
    });
}

async function handleLike(tweetId) {
  try {
    const response = await fetch(`${BASE_URL}/like_tweet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tweet_id: tweetId }),
    });
    if (!response.ok) throw new Error("Failed to like tweet");
  } catch (error) {
    console.error("Error:", error);
    isProfilePage ? loadUserTweets() : loadTweets();
  }
}

async function handleComment(tweetId, content) {
  try {
    const response = await fetch(`${BASE_URL}/comment_tweet`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ tweet_id: tweetId, content }),
    });
    if (!response.ok) throw new Error("Failed to add comment");
    isProfilePage ? loadUserTweets() : loadTweets();
  } catch (error) {
    console.error("Error:", error);
  }
}

async function loadTweets() {
  try {
    const response = await fetch(`${BASE_URL}/load_feed`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error("Failed to load tweets");
    const data = await response.json();
    if (data.reports && data.reports.length > 0) {
      const summaryElement = document.getElementById("feed-summary");
      if (summaryElement) {
        summaryElement.textContent = data.reports[0].summary;
      }
      renderTweets(data.reports[0].feeds);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function loadUserTweets() {
  try {
    const response = await fetch(`${BASE_URL}/load_tweets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        if_report: true,
        tweets: ["string"],
      }),
    });
    if (!response.ok) throw new Error("Failed to load tweets");
    const data = await response.json();
    if (data.reports && data.reports.length > 0) {
      const tweets = data.reports.flatMap((report) => report.slice(1));
      renderTweets(tweets);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

async function loadFollowingUsers() {
  try {
    const response = await fetch(`${BASE_URL}/load_user_profiles`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });
    if (!response.ok) throw new Error("Failed to load profiles");
    const data = await response.json();

    if (data.reports && data.reports.length > 0) {
      const profiles = data.reports[0];
      const followingListElement = document.getElementById("followingList");
      if (!followingListElement) return;

      followingListElement.innerHTML = "";

      const followingUsers = profiles.filter((profile) =>
        currentUserProfile?.context.followees?.includes(profile.id)
      );

      if (followingUsers.length === 0) {
        const noFollowingMsg = document.createElement("div");
        noFollowingMsg.className = "md-list-item";
        noFollowingMsg.textContent = "You're not following anyone yet";
        followingListElement.appendChild(noFollowingMsg);
        return;
      }

      followingUsers.forEach((profile) => {
        const template = document.getElementById("following-template");
        if (!template) return;

        const profileElement = template.content.cloneNode(true);
        profileElement.querySelector(".profile-name").textContent =
          profile.name;
        followingListElement.appendChild(profileElement);
      });
    }
  } catch (error) {
    console.error("Error loading following users:", error);
    const followingListElement = document.getElementById("followingList");
    if (followingListElement) {
      followingListElement.innerHTML =
        '<div class="md-list-item">Error loading following users</div>';
    }
  }
}

let lastScrollPosition = 0;

function saveScrollPosition() {
  const tweetsContainer = document.querySelector(".scrollable-tweets");
  if (tweetsContainer) {
    lastScrollPosition = tweetsContainer.scrollTop;
  }
}

function restoreScrollPosition() {
  const tweetsContainer = document.querySelector(".scrollable-tweets");
  if (tweetsContainer) {
    tweetsContainer.scrollTop = lastScrollPosition;
  }
}

document.querySelector(".scrollable-tweets")?.addEventListener("scroll", () => {
  saveScrollPosition();
});

async function initializePage() {
  try {
    await loadCurrentUserProfile();
    if (isProfilePage) {
      await loadUserTweets();
      await loadFollowingUsers();
    } else {
      await loadTweets();
      await loadProfilesToFollow();
    }
    restoreScrollPosition();
  } catch (error) {
    console.error("Page initialization error:", error);
  }
}

function handleResize() {
  const searchFormCard = document.querySelector(".search-form-card");
  const navSearchForm = document.querySelector(".nav-search-form");

  if (window.innerWidth <= 960) {
    searchFormCard?.style.setProperty("display", "block", "important");
    navSearchForm?.style.setProperty("display", "none", "important");
  } else {
    searchFormCard?.style.setProperty("display", "none", "important");
    navSearchForm?.style.setProperty("display", "flex", "important");
  }
}

window.addEventListener("resize", handleResize);

handleResize();

initializePage();
