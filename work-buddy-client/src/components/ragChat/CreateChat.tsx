import { useEffect, useState } from "react";
import { ActionPanel, Action, Form, showToast, Toast } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";

import useUnifiedChatStore from "@/store/unifiedChatStore";
import { generateChatName } from "@/lib/utils";

interface CreateChat {
  model: string;
  chatName: string;
}

export const CreateChat = () => {
  const setCurrentView = useUnifiedChatStore((state) => state.setCurrentView);
  const createChat = useUnifiedChatStore((state) => state.createChat);
  const loadChat = useUnifiedChatStore((state) => state.loadChat);
  const fetchInstalledModels = useUnifiedChatStore((state) => state.fetchInstalledModels);

  const [availableModels, setAvailableModels] = useState<string[]>([]); // State to hold fetched models
  const [isLoadingModels, setIsLoadingModels] = useState(true); // State to track loading

  useEffect(() => {
    async function getModels() {
      setIsLoadingModels(true);
      const fetchedModels = await fetchInstalledModels();
      setAvailableModels(fetchedModels);
      setIsLoadingModels(false);
    }

    getModels();
  }, [fetchInstalledModels]);

  const { handleSubmit, itemProps } = useForm<CreateChat>({
    onSubmit(values) {
      try {
        const model = values.model;
        const chatName = values.chatName;

        createChat({ model, chatName });

        showToast({
          style: Toast.Style.Success,
          title: "Yay! creating chat",
          message: `creating chat with name ${values.chatName}  and model ${values.model}`,
        });

        // Calling chat service to create a chat

        loadChat(generateChatName(chatName, model));
        setCurrentView("chatView");
      } catch (error) {
        console.error("Error creating chat:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Error Creating Chat",
          message: "An error occurred while creating the chat.",
        });
      }
    },
    validation: {
      chatName: FormValidation.Required,
      model: FormValidation.Required,
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
          <Action
            title="Chat List"
            shortcut={{ modifiers: ["opt"], key: "escape" }}
            onAction={() => setCurrentView("chatList")}
          />
        </ActionPanel>
      }
    >
      <Form.TextField title="Chat Name" placeholder="Brainstorm Buddies" error="Required" {...itemProps.chatName} />

      <Form.Dropdown id="model" title="AI Model" defaultValue="mistral:latest" isLoading={isLoadingModels}>
        {availableModels?.map((model) => <Form.Dropdown.Item key={model} value={model} title={model} icon="🚀" />)}
      </Form.Dropdown>
    </Form>
  );
};
