import { useState } from "react";
import { Detail } from "@raycast/api";

import { ChatList } from "@/components/chat/ChatList";
import { ModelSelection } from "@/components/chat/ModelSelection";
import { ChatView } from "@/components/chat/ChatView";
import { useChat } from "@/hooks/useChat";

import { StepView } from "./types";

const Talk = () => {
  const [step, setStep] = useState<StepView>("chatList");
  const { messages, existingChats, loadChat, deleteChat, sendMessage, inputMessage, setInputMessage, createChat } =
    useChat();

  const isChatEmpty = messages.length === 0;

  if (step === "chatList") {
    return <ChatList existingChats={existingChats} loadChat={loadChat} deleteChat={deleteChat} setStep={setStep} />;
  }

  if (step === "modelSelection") {
    return <ModelSelection setStep={setStep} loadChat={loadChat} createChat={createChat} />;
  }

  if (step === "chatView") {
    return (
      <ChatView
        messages={messages}
        isChatEmpty={isChatEmpty}
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        sendMessage={sendMessage}
      />
    );
  }

  return <Detail markdown="#Hey There!" />;
};

export default Talk;
