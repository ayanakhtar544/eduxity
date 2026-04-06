import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
    arrayRemove,
    arrayUnion,
    doc,
    increment,
    updateDoc,
} from "firebase/firestore";
import { db } from "../../core/firebase/firebaseConfig";

export const useLikePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    // 1. Ye actual Firebase call hai jo background me chalega
    mutationFn: async ({
      postId,
      currentUid,
      isLiked,
    }: {
      postId: string;
      currentUid: string;
      isLiked: boolean;
    }) => {
      const postRef = doc(db, "ai_feed_items", postId);
      if (isLiked) {
        // Agar pehle se liked tha, toh unlike karo
        await updateDoc(postRef, {
          likes: arrayRemove(currentUid),
          likesCount: increment(-1),
        });
      } else {
        // Naya like karo
        await updateDoc(postRef, {
          likes: arrayUnion(currentUid),
          likesCount: increment(1),
          trendScore: increment(2), // Like karne par post ko trend me upar bhejo
        });
      }
    },

    // 2. 🔥 OPTIMISTIC UPDATE: Ye UI ko turant change karta hai!
    onMutate: async ({ postId, currentUid, isLiked }) => {
      // Kisi bhi chalte hue background fetch ko roko taaki UI glitch na ho
      await queryClient.cancelQueries({ queryKey: ["ai_feed"] });

      // Purana data save karo (taaki agar net band ho toh wapas theek kar sakein)
      const previousFeed = queryClient.getQueryData(["ai_feed"]);

      // Turant UI update karo (Fake it till you make it)
      queryClient.setQueryData(["ai_feed"], (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page: any) => ({
            ...page,
            posts: page.posts.map((post: any) => {
              if (post.id === postId) {
                const newLikes = isLiked
                  ? post.likes.filter((id: string) => id !== currentUid)
                  : [...(post.likes || []), currentUid];
                return {
                  ...post,
                  likes: newLikes,
                  likesCount: post.likesCount + (isLiked ? -1 : 1),
                };
              }
              return post;
            }),
          })),
        };
      });

      return { previousFeed };
    },

    // 3. Agar Firebase me error aaya (jaise net chala gaya), toh purana UI wapas laao
    onError: (err, variables, context) => {
      if (context?.previousFeed) {
        queryClient.setQueryData(["ai_feed"], context.previousFeed);
      }
    },

    // 4. Sab theek hone ke baad data refresh kar lo
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["ai_feed"] });
    },
  });
};
