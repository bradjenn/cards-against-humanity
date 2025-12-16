export function SubmitCardsButton({
  disabled,
  onSubmit,
  pick,
}: {
  disabled: boolean;
  onSubmit: () => void;
  pick: number;
}) {
  return (
    <div className="flex justify-end">
      <button
        type="button"
        className="btn btn-primary rounded-sm"
        disabled={disabled}
        onClick={onSubmit}
      >
        Submit {pick} Card{pick > 1 ? "s" : ""}
      </button>
    </div>
  );
}
