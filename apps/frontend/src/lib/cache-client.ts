export async function revalidateCache(tag: string): Promise<boolean> {
  try {
    const response = await fetch("/api/revalidate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ tag })
    });

    if (!response.ok) {
      console.error("Failed to revalidate cache");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Revalidation error:", error);
    return false;
  }
}
