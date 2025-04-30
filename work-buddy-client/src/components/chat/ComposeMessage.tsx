import { ActionPanel, Action, Form, showToast, Toast } from "@raycast/api";
import { useForm, FormValidation } from "@raycast/utils";

import useUnifiedChatStore from "@/store/unifiedChatStore";

export const ComposeMessage = () => {
  const setInputMessage = useUnifiedChatStore((state) => state.setInputMessage);
  const sendMessage = useUnifiedChatStore((state) => state.sendMessage);
  const setCurrentView = useUnifiedChatStore((state) => state.setCurrentView);

  const { handleSubmit, itemProps } = useForm<{ message: string }>({
    onSubmit(values) {
      try {
        const message = values.message;
        setInputMessage(message);

        sendMessage();
        setCurrentView("chatView");
      } catch (error) {
        console.error("Error composing message:", error);
        showToast({
          style: Toast.Style.Failure,
          title: "Error Composing Message",
          message: "An error occurred while composing the message.",
        });
      }
    },
    validation: {
      message: FormValidation.Required,
    },
  });

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Submit" onSubmit={handleSubmit} />
          <Action
            title="Back to Chat"
            shortcut={{ modifiers: ["opt"], key: "escape" }}
            onAction={() => setCurrentView("chatView")}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea title="Message" placeholder="Ask your buddy..." error="Required" {...itemProps.message} />
    </Form>
  );
};
