export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {children}
    </div>
  );
}
