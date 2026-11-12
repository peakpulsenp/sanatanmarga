import { serverTimestamp } from "@/src/lib/firebase";
import { Article, User } from "@/src/types";
import { addDocWithQueue } from "@/src/lib/offlineQueue";
import { chautariStore } from "@/src/utils/chautariStore";

export const shareToChautari = async (article: Article, user: User | null) => {
  if (!user) {
    window.location.href = "/login";
    return null;
  }

  try {
    const postId = `chautari_share_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const postData = {
      id: postId,
      title: `${article.title} मा छलफल गरौं`,
      content: `यो समाचारको बारेमा तपाईंको धारणा के छ? छलफल सुरु गरौं।\n\n${article.excerpt}`,
      authorId: user.uid,
      authorName: user.displayName || "Anonymous",
      authorPhoto: user.photoURL || null,
      category: "छलफल",
      upvotes: 0,
      downvotes: 0,
      commentCount: 0,
      imageUrl: article.featuredImage,
      linkedArticleId: article.id,
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Store locally so it displays immediately across tabs and reloads
    chautariStore.addLocalPost(postData as any);

    // Queue operation for server sync / Firestore
    await addDocWithQueue("communityPosts", {
      ...postData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return postId;
  } catch (error) {
    console.error("Error sharing to Chautari:", error);
    throw error;
  }
};
