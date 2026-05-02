export default function Loading() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-black">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">加载中...</p>
      </div>
    </div>
  );
}
