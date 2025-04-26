import { useEffect } from "react";
import { Detail } from "@raycast/api";

import useUnifiedChatStore from "@/store/unifiedChatStore";
import { ChatList } from "@/components/ragChat/ChatList";
import { CreateChat } from "@/components/ragChat/CreateChat";
import { ChatView } from "@/components/ragChat/ChatView";
import { ComposeMessage } from "@/components/ragChat/ComposeMessage";
import FileList from "@/components/ragChat/FileManagement/FileList";
import AddFiles from "@/components/ragChat/FileManagement/AddFiles";

const RagTalk = () => {
  const currentView = useUnifiedChatStore((state) => state.currentView);
  const setCurrentService = useUnifiedChatStore((state) => state.setCurrentService);

  useEffect(() => {
    setCurrentService("ragChatService");
  }, []);

  if (currentView === "chatList") {
    return <ChatList />;
  }

  if (currentView === "createChat") {
    return <CreateChat />;
  }

  if (currentView === "fileManagement") {
    return <FileList />;
  }

  if (currentView === "fileList") {
    return <FileList />;
  }

  if (currentView === "addFile") {
    return <AddFiles />;
  }

  if (currentView === "composeMessage") {
    return <ComposeMessage />;
  }

  if (currentView === "chatView") {
    return <ChatView />;
  }

  return <Detail markdown="#Hey There!" />;
};

export default RagTalk;
