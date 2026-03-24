const USER_KEY = "prepplate-user-id";

export function getUserId(): string {
  if (typeof window === "undefined") return "server";
  
  let userId = localStorage.getItem(USER_KEY);
  if (!userId) {
    userId = "user-" + Math.random().toString(36).substring(2, 15);
    localStorage.setItem(USER_KEY, userId);
  }
  return userId;
}
