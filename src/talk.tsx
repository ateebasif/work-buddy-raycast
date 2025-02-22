import { Detail } from "@raycast/api";

import useChatStore from "@/store/chatStore";
import { ChatList } from "@/components/chat/ChatList";
import { CreateChat } from "@/components/chat/CreateChat";
import { ChatView } from "@/components/chat/ChatView";
import { ComposeMessage } from "@/components/chat/ComposeMessage";

const Talk = () => {
  const currentView = useChatStore((state) => state.currentView);

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
