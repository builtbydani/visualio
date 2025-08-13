import { useEffect } from "react";

export default function useDragDrop(hostRef, onFile) {
  useEffect(() => {
    const el = hostRef.current; if (!el) return;
    const onDragOver = (e) => { e.preventDefault(); el.classList.add("ring-2","ring-pink-400"); };
    const onLeave = () => el.classList.remove("ring-2","ring-pink-400");
    const onDrop = (e) => { e.preventDefault(); onLeave(); const f = e.dataTransfer?.files?.[0]; if (f) onFile(f); };
    el.addEventListener("dragover", onDragOver);
    el.addEventListener("dragleave", onLeave);
    el.addEventListener("drop", onDrop);
    return () => {
      el.removeEventListener("dragover", onDragOver);
      el.removeEventListener("dragleave", onLeave);
      el.removeEventListener("drop", onDrop);
    };
  }, [hostRef, onFile]);
}
