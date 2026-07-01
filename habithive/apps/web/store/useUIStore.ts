import { create } from "zustand";
 
interface UIState {
  /** Currently open modal id, or null. Keeps modal state out of every page. */
  activeModal: string | null;
  openModal: (id: string) => void;
  closeModal: () => void;
 
  /** Tracks whether the dissolution banner was manually dismissed this session. */
  dismissedDissolutionBanners: Set<string>;
  dismissDissolutionBanner: (hiveId: string) => void;
}
 
export const useUIStore = create<UIState>((set) => ({
  activeModal: null,
  openModal: (id) => set({ activeModal: id }),
  closeModal: () => set({ activeModal: null }),
 
  dismissedDissolutionBanners: new Set(),
  dismissDissolutionBanner: (hiveId) =>
    set((state) => ({
      dismissedDissolutionBanners: new Set(state.dismissedDissolutionBanners).add(hiveId),
    })),
}));