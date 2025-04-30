import { Detail } from "@raycast/api";

import useUnifiedChatStore from "@/store/unifiedChatStore";
import { ChatList } from "@/components/chat/ChatList";
import { CreateChat } from "@/components/chat/CreateChat";
import { ChatView } from "@/components/chat/ChatView";
import { ComposeMessage } from "@/components/chat/ComposeMessage";
import { useEffect } from "react";

const Talk = () => {
  const currentView = useUnifiedChatStore((state) => state.currentView);
  const setCurrentService = useUnifiedChatStore((state) => state.setCurrentService);

  useEffect(() => {
    setCurrentService("chatService");
  }, []);

  if (currentView === "chatList") {
    return <ChatList />;
  }

  if (currentView === "createChat") {
    return <CreateChat />;
  }

  if (currentView === "composeMessage") {
    return <ComposeMessage />;
  }

  if (currentView === "chatView") {
    return <ChatView />;
  }

  return <Detail markdown="#Hey There!" />;
};

export default Talk;
