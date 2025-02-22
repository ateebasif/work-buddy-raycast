import { ActionPanel, Action, Form, showToast, Toast } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";

import useChatStore from "@/store/chatStore";
import { MODELS } from "@/lib/constants";

interface CreateChat {
  model: string;
  chatName: string;
}

export const ModelSelection = () => {
  const setCurrentView = useChatStore((state) => state.setCurrentView);
  const createChat = useChatStore((state) => state.createChat);
  const loadChat = useChatStore((state) => state.loadChat);

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
        loadChat(`${chatName}-${model}`);
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
        </ActionPanel>
      }
    >
      <Form.TextField title="Chat Name" placeholder="Tim Cook" error="Required" {...itemProps.chatName} />

      <Form.Dropdown id="model" title="AI Model" defaultValue="mistral:latest">
        {MODELS.map((model) => (
          <Form.Dropdown.Item key={model} value={model} title={model} icon="🚀" />
        ))}
      </Form.Dropdown>
    </Form>
  );
};
