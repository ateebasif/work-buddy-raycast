import { Detail } from "@raycast/api";

import useChatStore from "@/store/chatStore";
import { ChatList } from "@/components/chat/ChatList";
import { ModelSelection } from "@/components/chat/CreateChat";
import { ChatView } from "@/components/chat/ChatView";

const Talk = () => {
  const currentView = useChatStore((state) => state.currentView);

  if (currentView === "chatList") {
    return <ChatList />;
  }

  if (currentView === "createChat") {
    return <ModelSelection />;
  }

  if (currentView === "chatView") {
    return <ChatView />;
  }

  return <Detail markdown="#Hey There!" />;
};

export default Talk;
