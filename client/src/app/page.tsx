import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ChatPage } from "@/components/chat/ChatPage";

export default function Home() {
  return (
    <ProtectedRoute>
      <ChatPage />
    </ProtectedRoute>
  );
}
