import { Detail } from "@raycast/api";

import useChatStore from "@/store/chatStore";
import { ChatList } from "@/components/chat2/ChatList";
import { ModelSelection } from "@/components/chat2/CreateChat";
import { ChatView } from "@/components/chat2/ChatView";

const talk3 = () => {
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

export default talk3;
