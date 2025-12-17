import { ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

type ToolbarButton = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "outline";
  className?: string;
};

type ToolbarContent = ToolbarButton | { message: string };

export function BottomToolbar({
  gameInfoButton,
  content,
}: {
  gameInfoButton: {
    onClick: () => void;
  };
  content?: ToolbarContent;
}) {
  const isMessage = content && "message" in content;
  const isButton = content && "label" in content;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-base-100 border-t z-30">
      <div className="flex justify-between max-w-4xl px-8 py-3 mx-auto gap-3">
        <button
          type="button"
          onClick={gameInfoButton.onClick}
          className="btn btn-outline rounded-sm"
        >
          Game Info
          <ChevronUp />
        </button>

        {isMessage && (
          <div className="flex items-center flex-1 justify-end text-sm text-base-content/70 font-bold">
            {content.message}
          </div>
        )}

        {isButton && (
          <button
            type="button"
            className={cn(
              "btn rounded-sm",
              content.variant === "primary" ? "btn-primary" : "btn-outline",
              content.className,
            )}
            disabled={content.disabled}
            onClick={content.onClick}
          >
            {content.label}
          </button>
        )}
      </div>
    </div>
  );
}
