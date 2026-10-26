import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-right"
      closeButton
      duration={4000}
      visibleToasts={3}
      offset={16}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:!rounded-full group-[.toaster]:!py-2.5 group-[.toaster]:!pl-4 group-[.toaster]:!pr-6 group-[.toaster]:!w-fit group-[.toaster]:!left-auto group-[.toaster]:!right-0 group-[.toaster]:!min-w-[220px] group-[.toaster]:!max-w-[360px] group-[.toaster]:!text-sm group-[.toaster]:!font-medium group-[.toaster]:!gap-2",
          success:
            "group-[.toaster]:!bg-green-50 group-[.toaster]:!text-green-800 group-[.toaster]:!border-green-300 dark:group-[.toaster]:!bg-green-950 dark:group-[.toaster]:!text-green-200 dark:group-[.toaster]:!border-green-800",
          error:
            "group-[.toaster]:!bg-red-50 group-[.toaster]:!text-red-800 group-[.toaster]:!border-red-300 dark:group-[.toaster]:!bg-red-950 dark:group-[.toaster]:!text-red-200 dark:group-[.toaster]:!border-red-800",
          closeButton:
            "!left-auto !right-1 !top-1 !translate-x-0 !translate-y-0 !size-4 !rounded-full !border !border-current/20 !bg-background !text-current !opacity-80 hover:!opacity-100 [&>svg]:!size-2.5",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster, toast };
