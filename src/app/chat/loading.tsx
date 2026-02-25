export default function ChatLoading() {
  return (
    <div className="h-screen bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 flex flex-col">
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="h-8 w-32 bg-gray-200 rounded animate-pulse mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse" />
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-[#ff0000] border-r-transparent"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading AI Assistant...</p>
        </div>
      </div>
    </div>
  );
}
