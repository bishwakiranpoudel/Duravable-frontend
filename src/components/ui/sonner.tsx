"use client";

import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Brand: horizontal bar below nav, severity colors, white copy, 6s dismiss (errors persist in callers via duration).
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      position="top-center"
      offset={64}
      expand
      visibleToasts={4}
      className="toaster group !w-full !max-w-none"
      toastOptions={{
        duration: 6000,
        classNames: {
          toast:
            "group toast !w-full !max-w-full !rounded-none !border-0 !border-b !border-white/25 !py-3 !px-4 !shadow-none !font-body !text-sm sm:!text-base",
          title: "!font-display !font-bold !text-white",
          description: "!text-white/95 !font-body",
          success: "!bg-[hsl(var(--brand-success))] !text-white",
          error: "!bg-[hsl(var(--brand-error))] !text-white",
          warning: "!bg-[hsl(var(--brand-warning))] !text-white",
          info: "!bg-[hsl(var(--brand-success))] !text-white",
          closeButton:
            "!text-white !border-white/40 hover:!bg-white/10",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
