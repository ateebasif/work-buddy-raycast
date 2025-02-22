import { ActionPanel, Action, Form, showToast, Toast } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";

import { MODELS } from "@/lib/constants";
import { StepView } from "@/types/index";

interface ModelSelectionProps {
  setStep: (step: StepView) => void;
  loadChat: (chatName: string) => void;
  createChat: ({ model, chatName }: CreateChat) => void;
}

interface CreateChat {
  model: string;
  chatName: string;
}

export const ModelSelection = ({ setStep, loadChat, createChat }: ModelSelectionProps) => {
  const { handleSubmit, itemProps } = useForm<CreateChat>({
    onSubmit(values) {
      showToast({
        style: Toast.Style.Success,
        title: "Yay! creating chat",
        message: `creating chat with name ${values.chatName}  and model ${values.model}`,
      });

      // Create chat logic here
      const chatName = values.chatName;
      const model = values.model;

      createChat({ model: values.model, chatName: values.chatName });

      // Call your chat service to create a chat
      loadChat(`${chatName}-${model}`);
      setStep("chatView");
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
