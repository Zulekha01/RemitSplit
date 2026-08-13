"use client";

import { create } from "zustand";
import { Family, Member, AllocationRule, Role, AllocationStrategy, AllocationItem } from "@/types";
import { logger } from "@/lib/logger";
import { registryContractService, TxSignerOptions } from "@/services/registry-contract";

interface FamilyStore {
  families: Family[];
  selectedFamilyId: number;
  rules: Record<number, AllocationRule[]>;
  isLoadingOnChain: boolean;
  selectFamily: (id: number) => void;
  syncOnChainState: (familyId?: number) => Promise<void>;
  createFamily: (name: string, owner: string, options?: TxSignerOptions) => Promise<{ id: number; hash?: string }>;
  addMember: (familyId: number, memberAddress: string, role: Role, name: string, caller?: string, options?: TxSignerOptions) => Promise<string | undefined>;
  removeMember: (familyId: number, memberAddress: string, caller?: string, options?: TxSignerOptions) => Promise<string | undefined>;
  createRule: (
    familyId: number,
    strategy: AllocationStrategy,
    allocations: AllocationItem[],
    createdBy: string,
    options?: TxSignerOptions
  ) => Promise<{ version: number; hash?: string }>;
  activateRule: (familyId: number, version: number, caller?: string, options?: TxSignerOptions) => Promise<string | undefined>;
  deactivateRule: (familyId: number, caller?: string, options?: TxSignerOptions) => Promise<string | undefined>;
  getSelectedFamily: () => Family | undefined;
}

export const useFamilyStore = create<FamilyStore>((set, get) => ({
  families: [],
  selectedFamilyId: 0,
  isLoadingOnChain: false,
  rules: {},

  selectFamily: (id: number) => {
    set({ selectedFamilyId: id });
  },

  getSelectedFamily: () => {
    const { families, selectedFamilyId } = get();
    if (families.length === 0) return undefined;
    return families.find((f) => f.id === selectedFamilyId) || families[0];
  },

  syncOnChainState: async (targetFamilyId?: number) => {
    set({ isLoadingOnChain: true });
    try {
      if (targetFamilyId && targetFamilyId > 0) {
        const onChainFamily = await registryContractService.fetchFamily(targetFamilyId);
        if (onChainFamily) {
          const [members, activeRule, allRules] = await Promise.all([
            registryContractService.fetchMembers(targetFamilyId),
            registryContractService.fetchActiveRule(targetFamilyId),
            registryContractService.fetchAllRules(targetFamilyId),
          ]);

          const fullFamily: Family = {
            ...onChainFamily,
            members,
            activeRule: activeRule || undefined,
          };

          set((state) => {
            const exists = state.families.some((f) => f.id === targetFamilyId);
            const updatedFamilies = exists
              ? state.families.map((f) => (f.id === targetFamilyId ? fullFamily : f))
              : [...state.families, fullFamily];

            return {
              families: updatedFamilies,
              rules: {
                ...state.rules,
                [targetFamilyId]: allRules.length > 0 ? allRules : activeRule ? [activeRule] : [],
              },
              selectedFamilyId: state.selectedFamilyId === 0 ? fullFamily.id : state.selectedFamilyId,
            };
          });
        }
      } else {
        const loadedFamilies: Family[] = [];
        const loadedRules: Record<number, AllocationRule[]> = {};

        let currentId = 1;
        while (currentId <= 50) {
          try {
            const fam = await registryContractService.fetchFamily(currentId);
            if (!fam) break;

            const [members, activeRule, allRules] = await Promise.all([
              registryContractService.fetchMembers(currentId),
              registryContractService.fetchActiveRule(currentId),
              registryContractService.fetchAllRules(currentId),
            ]);

            const fullFamily: Family = {
              ...fam,
              members,
              activeRule: activeRule || undefined,
            };

            loadedFamilies.push(fullFamily);
            loadedRules[currentId] = allRules.length > 0 ? allRules : activeRule ? [activeRule] : [];
            currentId++;
          } catch {
            break;
          }
        }

        set((state) => ({
          families: loadedFamilies,
          rules: loadedRules,
          selectedFamilyId:
            state.selectedFamilyId > 0 && loadedFamilies.some((f) => f.id === state.selectedFamilyId)
              ? state.selectedFamilyId
              : loadedFamilies[0]?.id || 0,
        }));
        logger.info("FamilyStore", `Synced ${loadedFamilies.length} families from on-chain contract`);
      }
    } catch (err) {
      logger.error("FamilyStore", "Failed to sync on-chain family state", err);
    } finally {
      set({ isLoadingOnChain: false });
    }
  },

  createFamily: async (name: string, owner: string, options?: TxSignerOptions) => {
    if (!owner) {
      throw new Error("Wallet not connected: owner address required to create family");
    }

    const res = await registryContractService.executeCreateFamily(owner, name, options);
    await get().syncOnChainState();

    const currentFamilies = get().families;
    const created = currentFamilies.find((f) => f.name === name) || currentFamilies[currentFamilies.length - 1];
    const newId = created?.id || 1;

    set({ selectedFamilyId: newId });
    logger.info("FamilyStore", `Created family ${name} on-chain with id ${newId}`);
    return { id: newId, hash: res.hash };
  },

  addMember: async (
    familyId: number,
    memberAddress: string,
    role: Role,
    name: string,
    caller?: string,
    options?: TxSignerOptions
  ) => {
    const callerAddress = caller || get().families.find((f) => f.id === familyId)?.owner;
    if (!callerAddress) {
      throw new Error("Wallet not connected: caller address required to add member");
    }

    const res = await registryContractService.executeAddMember(
      callerAddress,
      familyId,
      memberAddress,
      role,
      name,
      options
    );

    await get().syncOnChainState(familyId);
    logger.info("FamilyStore", `Added member ${name} (${role}) to family ${familyId}`);
    return res.hash;
  },

  removeMember: async (
    familyId: number,
    memberAddress: string,
    caller?: string,
    options?: TxSignerOptions
  ) => {
    const callerAddress = caller || get().families.find((f) => f.id === familyId)?.owner;
    if (!callerAddress) {
      throw new Error("Wallet not connected: caller address required to remove member");
    }

    const res = await registryContractService.executeRemoveMember(
      callerAddress,
      familyId,
      memberAddress,
      options
    );

    await get().syncOnChainState(familyId);
    logger.info("FamilyStore", `Removed member ${memberAddress} from family ${familyId}`);
    return res.hash;
  },

  createRule: async (
    familyId: number,
    strategy: AllocationStrategy,
    allocations: AllocationItem[],
    createdBy: string,
    options?: TxSignerOptions
  ) => {
    if (!createdBy) {
      throw new Error("Wallet not connected: creator address required to create rule");
    }

    const res = await registryContractService.executeCreateRule(
      createdBy,
      familyId,
      strategy,
      allocations,
      options
    );

    await get().syncOnChainState(familyId);
    const rules = get().rules[familyId] || [];
    const latestVersion = rules.length > 0 ? Math.max(...rules.map((r) => r.version)) : 1;

    logger.info("FamilyStore", `Created rule version ${latestVersion} for family ${familyId}`);
    return { version: latestVersion, hash: res.hash };
  },

  activateRule: async (
    familyId: number,
    version: number,
    caller?: string,
    options?: TxSignerOptions
  ) => {
    const callerAddress = caller || get().families.find((f) => f.id === familyId)?.owner;
    if (!callerAddress) {
      throw new Error("Wallet not connected: caller address required to activate rule");
    }

    const res = await registryContractService.executeActivateRule(
      callerAddress,
      familyId,
      version,
      options
    );

    await get().syncOnChainState(familyId);
    logger.info("FamilyStore", `Activated rule version ${version} for family ${familyId}`);
    return res.hash;
  },

  deactivateRule: async (
    familyId: number,
    caller?: string,
    options?: TxSignerOptions
  ) => {
    const callerAddress = caller || get().families.find((f) => f.id === familyId)?.owner;
    if (!callerAddress) {
      throw new Error("Wallet not connected: caller address required to deactivate rule");
    }

    const res = await registryContractService.executeDeactivateRule(
      callerAddress,
      familyId,
      options
    );

    await get().syncOnChainState(familyId);
    logger.info("FamilyStore", `Deactivated rule for family ${familyId}`);
    return res.hash;
  },
}));
